"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/rbac/guards";
import { recordAuditLog } from "@/lib/audit/logger";
import {
  universityCreateSchema,
  universityUpdateSchema,
} from "./schemas";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

const BCRYPT_ROUNDS = 12;

async function verifySuperAdminCaller(permission?: string) {
  const caller = await getCurrentUser();
  if (!caller || !caller.isActive) {
    throw new Error("جلسة العمل غير صالحة أو منتهية.");
  }
  if (caller.roleCode !== "SUPER_ADMIN") {
    throw new Error("هذه العملية محصورة بالمدير الوطني العام للمنصة (SUPER_ADMIN).");
  }
  if (permission && !caller.permissions.includes(permission)) {
    throw new Error(`ينقصك الإذن المركزي المطلوب (${permission}).`);
  }
  return caller;
}

/**
 * Server Action : التسجيل المركزي لجامعة جديدة في المنصة الوطنية
 */
export async function createUniversityAction(
  formData: FormData
): Promise<ActionResult<{ universityId: string }>> {
  try {
    const caller = await verifySuperAdminCaller("universities.create");

    const rawData = {
      name: formData.get("name")?.toString()?.trim() || "",
      code: formData.get("code")?.toString()?.trim()?.toUpperCase() || "",
      wilaya: formData.get("wilaya")?.toString()?.trim() || "",
      address: formData.get("address")?.toString()?.trim() || undefined,
      phone: formData.get("phone")?.toString()?.trim() || undefined,
      email: formData.get("email")?.toString()?.trim() || undefined,
      website: formData.get("website")?.toString()?.trim() || undefined,
      description: formData.get("description")?.toString()?.trim() || undefined,
    };

    const parsed = universityCreateSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "بيانات الإدخال غير صالحة." };
    }

    const { name, code, wilaya, address, phone, email, website, description } = parsed.data;

    // Champs optionnels pour le premier administrateur
    const adminFirstName = formData.get("adminFirstName")?.toString()?.trim() || "";
    const adminLastName  = formData.get("adminLastName")?.toString()?.trim() || "";
    const adminEmail     = formData.get("adminEmail")?.toString()?.trim()?.toLowerCase() || "";
    const adminPassword  = formData.get("adminPassword")?.toString() || "";
    const hasAnyAdminField = Boolean(adminFirstName || adminLastName || adminEmail || adminPassword);

    if (hasAnyAdminField) {
      if (!adminFirstName || !adminLastName) {
        return { success: false, error: "الرجاء إدخال الاسم واللقب الكاملين لمدير النظام." };
      }
      if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
        return { success: false, error: "الرجاء إدخال بريد إلكتروني صالح لمدير النظام." };
      }
      if (!adminPassword || adminPassword.length < 8) {
        return { success: false, error: "كلمة المرور لمدير النظام يجب ألا تقل عن 8 أحرف." };
      }
    }
    const createAdmin = hasAnyAdminField;

    // Vérifier l'unicité du code institutionnel
    const existingCode = await prisma.organization.findUnique({
      where: { code },
    });
    if (existingCode) {
      return { success: false, error: `الرمز المؤسسي "${code}" مستخدم بالفعل لجامعة أخرى.` };
    }

    if (createAdmin) {
      const existingAdminEmail = await prisma.user.findUnique({ where: { email: adminEmail } });
      if (existingAdminEmail) {
        return { success: false, error: `البريد الإلكتروني "${adminEmail}" مستخدم بالفعل لحساب آخر.` };
      }
    }

    const adminRole = createAdmin ? await prisma.role.findUnique({ where: { code: "ADMIN" } }) : null;
    if (createAdmin && !adminRole) {
      return { success: false, error: "دور مدير النظام (ADMIN) غير مهيأ في قاعدة البيانات." };
    }

    const passwordHash = createAdmin ? await bcrypt.hash(adminPassword, BCRYPT_ROUNDS) : null;

    // Création de l'Université dans une transaction avec ses unités fondamentales
    const university = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name,
          code,
          wilaya,
          address: address || null,
          phone: phone || null,
          email: email || null,
          website: website || null,
          description: description || null,
          status: "ACTIVE",
          isActive: true,
        },
      });

      // Création de l'unité racine par défaut : رئاسة الجامعة
      await tx.organizationUnit.create({
        data: {
          name: "رئاسة الجامعة",
          code: `${code}-PRES`,
          type: "PRESIDENCY",
          organizationId: org.id,
          isActive: true,
        },
      });

      // Création optionnelle du premier administrateur
      if (createAdmin && adminRole && passwordHash) {
        await tx.user.create({
          data: {
            email: adminEmail,
            passwordHash,
            firstName: adminFirstName,
            lastName: adminLastName,
            roleId: adminRole.id,
            organizationId: org.id,
            isActive: true,
          },
        });
      }

      return org;
    });

    await recordAuditLog({
      userId: caller.id,
      organizationId: university.id,
      action: "UNIVERSITY_CREATED",
      resourceType: "ORGANIZATION",
      resourceId: university.id,
      details: {
        name: university.name,
        code: university.code,
        wilaya: university.wilaya,
        initialAdminCreated: createAdmin,
        initialAdminEmail: createAdmin ? adminEmail : null,
      },
    });

    revalidatePath("/super-admin/universities");
    revalidatePath("/super-admin/dashboard");

    return { success: true, data: { universityId: university.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تسجيل الجامعة.",
    };
  }
}


/**
 * Server Action : تحيين البيانات المؤسسية لجامعة
 */
export async function updateUniversityAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const caller = await verifySuperAdminCaller("universities.update");

    const rawData = {
      id: formData.get("id")?.toString()?.trim() || "",
      name: formData.get("name")?.toString()?.trim() || "",
      wilaya: formData.get("wilaya")?.toString()?.trim() || "",
      address: formData.get("address")?.toString()?.trim() || undefined,
      phone: formData.get("phone")?.toString()?.trim() || undefined,
      email: formData.get("email")?.toString()?.trim() || undefined,
      website: formData.get("website")?.toString()?.trim() || undefined,
      description: formData.get("description")?.toString()?.trim() || undefined,
    };

    const parsed = universityUpdateSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "بيانات الإدخال غير صالحة." };
    }

    const { id, name, wilaya, address, phone, email, website, description } = parsed.data;

    const existing = await prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "المؤسسة الجامعية غير موجودة." };
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        name,
        wilaya,
        address: address || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        description: description || null,
      },
    });

    await recordAuditLog({
      userId: caller.id,
      organizationId: id,
      action: "UNIVERSITY_UPDATED",
      resourceType: "ORGANIZATION",
      resourceId: id,
      details: {
        name: updated.name,
        wilaya: updated.wilaya,
      },
    });

    revalidatePath("/super-admin/universities");
    revalidatePath(`/super-admin/universities/${id}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تعديل بيانات الجامعة.",
    };
  }
}

/**
 * Server Action : تغيير حالة الجامعة (تجميد / تنشيط / أرشفة)
 */
export async function toggleUniversityStatusAction(
  id: string,
  targetStatus: "ACTIVE" | "SUSPENDED" | "ARCHIVED",
  reason?: string
): Promise<ActionResult> {
  try {
    const caller = await verifySuperAdminCaller("universities.suspend");

    const university = await prisma.organization.findUnique({
      where: { id },
    });

    if (!university) {
      return { success: false, error: "المؤسسة الجامعية غير موجودة." };
    }

    // Protection : Ne jamais supprimer physiquement une université contenant des données financières
    const updateData: Record<string, unknown> = {
      status: targetStatus,
      isActive: targetStatus === "ACTIVE",
    };

    if (targetStatus === "SUSPENDED") {
      updateData.suspendedAt = new Date();
      updateData.suspendedReason = reason || "تجميد بقرار من الإدارة المركزية";
    } else if (targetStatus === "ACTIVE") {
      updateData.suspendedAt = null;
      updateData.suspendedReason = null;
    } else if (targetStatus === "ARCHIVED") {
      updateData.archivedAt = new Date();
    }

    await prisma.organization.update({
      where: { id },
      data: updateData,
    });

    const auditAction = targetStatus === "ACTIVE"
      ? "UNIVERSITY_REACTIVATED"
      : targetStatus === "SUSPENDED"
        ? "UNIVERSITY_SUSPENDED"
        : "UNIVERSITY_ARCHIVED";

    await recordAuditLog({
      userId: caller.id,
      organizationId: id,
      action: auditAction,
      resourceType: "ORGANIZATION",
      resourceId: id,
      details: {
        universityName: university.name,
        universityCode: university.code,
        previousStatus: university.status,
        newStatus: targetStatus,
        reason,
      },
    });

    revalidatePath("/super-admin/universities");
    revalidatePath(`/super-admin/universities/${id}`);
    revalidatePath("/super-admin/dashboard");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تغيير حالة الجامعة.",
    };
  }
}

/**
 * Server Action : تعيين مدير نظام أول (ADMIN) لجامعة مسجلة
 */
export async function createUniversityAdminAction(
  universityId: string,
  formData: FormData
): Promise<ActionResult<{ userId: string }>> {
  try {
    const caller = await verifySuperAdminCaller("universities.update");

    const firstName = formData.get("firstName")?.toString()?.trim() || "";
    const lastName = formData.get("lastName")?.toString()?.trim() || "";
    const email = formData.get("email")?.toString()?.trim()?.toLowerCase() || "";
    const password = formData.get("password")?.toString() || "";

    if (!firstName || !lastName || !email || password.length < 8) {
      return { success: false, error: "يرجى تعبئة كافة الحقول بشكل صحيح (كلمة المرور 8 أحرف على الأقل)." };
    }

    const org = await prisma.organization.findUnique({
      where: { id: universityId },
    });
    if (!org) {
      return { success: false, error: "المؤسسة الجامعية غير موجودة." };
    }

    const adminRole = await prisma.role.findUnique({
      where: { code: "ADMIN" },
    });
    if (!adminRole) {
      return { success: false, error: "دور مدير النظام (ADMIN) غير مهيأ." };
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return { success: false, error: "البريد الإلكتروني مستخدم مسبقاً لحساب آخر." };
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const newAdmin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        roleId: adminRole.id,
        organizationId: universityId,
        isActive: true,
      },
    });

    await recordAuditLog({
      userId: caller.id,
      organizationId: universityId,
      action: "USER_CREATED",
      resourceType: "USER",
      resourceId: newAdmin.id,
      details: {
        targetEmail: newAdmin.email,
        targetRole: "ADMIN",
        university: org.name,
        assignedBySuperAdmin: true,
      },
    });

    revalidatePath(`/super-admin/universities/${universityId}`);

    return { success: true, data: { userId: newAdmin.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تعيين مدير الجامعة.",
    };
  }
}

/**
 * Server Action : الحذف النهائي لمؤسسة جامعية من المنصة المركزية
 * محمية بضوابط أمنية، تدقيق رقابي، ومطابقة للرمز المؤسسي
 */
export async function deleteUniversityAction(
  id: string,
  confirmationCode: string,
  reason?: string
): Promise<ActionResult> {
  try {
    const caller = await verifySuperAdminCaller("universities.archive");

    const university = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true,
            units: true,
            batches: true,
            users: true,
          },
        },
      },
    });

    if (!university) {
      return { success: false, error: "المؤسسة الجامعية المراد حذفها غير موجودة." };
    }

    // Vérification stricte du code saisi par le Super Admin
    if (confirmationCode.trim().toUpperCase() !== university.code.trim().toUpperCase()) {
      return {
        success: false,
        error: `رمز التأكيد غير مطابق. يرجى كتابة الرمز المؤسسي "${university.code}" بدقة لتأكيد الحذف.`,
      };
    }

    // Suppression en cascade maîtrisée et sécurisée
    await prisma.$transaction(async (tx) => {
      // 1. Lots de paie et sous-dépendances
      const batches = await tx.payrollBatch.findMany({
        where: { organizationId: id },
        select: { id: true },
      });
      const batchIds = batches.map((b) => b.id);

      if (batchIds.length > 0) {
        const paymentOrders = await tx.paymentOrder.findMany({
          where: { batchId: { in: batchIds } },
          select: { id: true },
        });
        const poIds = paymentOrders.map((p) => p.id);
        if (poIds.length > 0) {
          await tx.paymentTransaction.deleteMany({
            where: { paymentOrderId: { in: poIds } },
          });
          await tx.paymentOrder.deleteMany({
            where: { id: { in: poIds } },
          });
        }

        const findings = await tx.auditFinding.findMany({
          where: { batchId: { in: batchIds } },
          select: { id: true },
        });
        const findingIds = findings.map((f) => f.id);
        if (findingIds.length > 0) {
          await tx.aIAnalysis.deleteMany({
            where: { findingId: { in: findingIds } },
          });
          await tx.auditFinding.deleteMany({
            where: { id: { in: findingIds } },
          });
        }

        await tx.workflowAction.deleteMany({
          where: { batchId: { in: batchIds } },
        });
        await tx.payrollLineItem.deleteMany({
          where: { batchId: { in: batchIds } },
        });
        await tx.attendanceRecord.deleteMany({
          where: { batchId: { in: batchIds } },
        });
        await tx.payrollRecord.deleteMany({
          where: { batchId: { in: batchIds } },
        });
        await tx.batchEmployee.deleteMany({
          where: { batchId: { in: batchIds } },
        });
        await tx.payrollBatch.deleteMany({
          where: { id: { in: batchIds } },
        });
      }

      // 2. Employés et sous-dépendances
      const employees = await tx.employee.findMany({
        where: { organizationId: id },
        select: { id: true },
      });
      const employeeIds = employees.map((e) => e.id);

      if (employeeIds.length > 0) {
        await tx.employeeHistory.deleteMany({
          where: { employeeId: { in: employeeIds } },
        });
        await tx.user.updateMany({
          where: { employeeId: { in: employeeIds } },
          data: { employeeId: null },
        });
        await tx.paymentTransaction.deleteMany({
          where: { employeeId: { in: employeeIds } },
        });
        await tx.payrollRecord.deleteMany({
          where: { employeeId: { in: employeeIds } },
        });
        await tx.payrollLineItem.deleteMany({
          where: { employeeId: { in: employeeIds } },
        });
        await tx.attendanceRecord.deleteMany({
          where: { employeeId: { in: employeeIds } },
        });
        await tx.batchEmployee.deleteMany({
          where: { employeeId: { in: employeeIds } },
        });
        await tx.auditFinding.deleteMany({
          where: { employeeId: { in: employeeIds } },
        });
        await tx.employee.deleteMany({
          where: { id: { in: employeeIds } },
        });
      }

      // 3. Utilisateurs institutionnels de cette université
      const users = await tx.user.findMany({
        where: { organizationId: id },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);

      if (userIds.length > 0) {
        await tx.session.deleteMany({
          where: { userId: { in: userIds } },
        });
        await tx.notification.deleteMany({
          where: { userId: { in: userIds } },
        });
        await tx.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }

      // 4. Unités et paramètres institutionnels
      await tx.organizationUnit.deleteMany({
        where: { organizationId: id },
      });
      await tx.universitySetting.deleteMany({
        where: { organizationId: id },
      });

      // 5. Préservation des traces d'audit (déconnexion du tenant)
      await tx.auditLog.updateMany({
        where: { organizationId: id },
        data: { organizationId: null },
      });

      // 6. Suppression définitive de l'organisation
      await tx.organization.delete({
        where: { id },
      });
    });

    // Enregistrement d'un log d'audit central
    await recordAuditLog({
      userId: caller.id,
      organizationId: null,
      action: "UNIVERSITY_DELETED",
      resourceType: "ORGANIZATION",
      resourceId: id,
      details: {
        deletedUniversityName: university.name,
        deletedUniversityCode: university.code,
        deletedStats: {
          employees: university._count.employees,
          units: university._count.units,
          batches: university._count.batches,
          users: university._count.users,
        },
        reason: reason || "حذف نهائي للمؤسسة الجامعية من اللوحة المركزية",
      },
    });

    revalidatePath("/super-admin/universities");
    revalidatePath("/super-admin/dashboard");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء حذف المؤسسة الجامعية.",
    };
  }
}
