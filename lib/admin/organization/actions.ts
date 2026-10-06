"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/rbac/guards";
import { recordAuditLog } from "@/lib/audit/logger";
import {
  organizationUpdateSchema,
  organizationUnitSchema,
} from "./schemas";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

async function verifyAdminCaller(permission?: string) {
  const caller = await getCurrentUser();
  if (!caller || !caller.isActive || caller.roleCode !== "ADMIN") {
    throw new Error("غير مصرح لك بإدارة الهيكل التنظيمي.");
  }
  if (permission && !caller.permissions.includes(permission)) {
    throw new Error(`ينقصك إذن الوصول الإداري المطلوبة (${permission}).`);
  }
  return caller;
}

/**
 * Server Action : Mise à jour des informations de l'université
 */
export async function updateOrganizationAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const caller = await verifyAdminCaller("organization.update");

    const rawData = {
      id: formData.get("id")?.toString()?.trim() || "",
      name: formData.get("name")?.toString()?.trim() || "",
      address: formData.get("address")?.toString()?.trim() || "",
      wilaya: formData.get("wilaya")?.toString()?.trim() || "",
      phone: formData.get("phone")?.toString()?.trim() || "",
      email: formData.get("email")?.toString()?.trim() || "",
      website: formData.get("website")?.toString()?.trim() || "",
      description: formData.get("description")?.toString()?.trim() || "",
    };

    const parsed = organizationUpdateSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "بيانات غير صالحة." };
    }

    const { id, name, address, wilaya, phone, email, website, description } = parsed.data;

    const orgBefore = await prisma.organization.findUnique({
      where: { id },
    });

    if (!orgBefore) {
      return { success: false, error: "المؤسسة غير موجودة." };
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        name,
        address: address || null,
        wilaya: wilaya || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        description: description || null,
      },
    });

    await recordAuditLog({
      userId: caller.id,
      action: "ORGANIZATION_UPDATED",
      resourceType: "ORGANIZATION",
      resourceId: id,
      details: {
        name: updated.name,
        wilaya: updated.wilaya,
        phone: updated.phone,
      },
    });

    revalidatePath("/admin/organization");
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تحديث بيانات المؤسسة.",
    };
  }
}

/**
 * Server Action : Création d'une unité organisationnelle
 */
export async function createOrganizationUnitAction(
  formData: FormData
): Promise<ActionResult<{ unitId: string }>> {
  try {
    const caller = await verifyAdminCaller("organization.update");

    const rawData = {
      name: formData.get("name")?.toString()?.trim() || "",
      code: formData.get("code")?.toString()?.trim()?.toUpperCase() || "",
      type: formData.get("type")?.toString()?.trim() || "SERVICE",
      parentId: formData.get("parentId")?.toString()?.trim() || null,
      organizationId: formData.get("organizationId")?.toString()?.trim() || "",
      isActive: formData.get("isActive") === "false" ? false : true,
    };

    const parsed = organizationUnitSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "بيانات الوحدة غير صالحة." };
    }

    const { name, code, type, parentId, organizationId, isActive } = parsed.data;

    // Vérifier l'unicité du code
    const existingCode = await prisma.organizationUnit.findUnique({
      where: { code },
    });
    if (existingCode) {
      return { success: false, error: "الرمز التقني لهذه الوحدة مستخدم مسبقاً." };
    }

    const newUnit = await prisma.organizationUnit.create({
      data: {
        name,
        code,
        type,
        parentId: parentId || null,
        organizationId,
        isActive,
      },
    });

    await recordAuditLog({
      userId: caller.id,
      action: "ORGANIZATION_UNIT_CREATED",
      resourceType: "ORGANIZATION_UNIT",
      resourceId: newUnit.id,
      details: {
        name: newUnit.name,
        code: newUnit.code,
        type: newUnit.type,
      },
    });

    revalidatePath("/admin/organization");

    return { success: true, data: { unitId: newUnit.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء الوحدة.",
    };
  }
}

/**
 * Server Action : Mise à jour d'une unité organisationnelle
 */
export async function updateOrganizationUnitAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const caller = await verifyAdminCaller("organization.update");

    const id = formData.get("id")?.toString()?.trim() || "";
    const name = formData.get("name")?.toString()?.trim() || "";
    const type = formData.get("type")?.toString()?.trim() || "SERVICE";
    const parentId = formData.get("parentId")?.toString()?.trim() || null;
    const isActive = formData.get("isActive") === "true";

    if (!id || !name) {
      return { success: false, error: "اسم الوحدة ومعرفها مطلوبان." };
    }

    // Interdire d'avoir soi-même comme parent
    if (parentId && parentId === id) {
      return { success: false, error: "لا يمكن أن تكون الوحدة الإدارية فرعاً لنفسها." };
    }

    const updated = await prisma.organizationUnit.update({
      where: { id },
      data: {
        name,
        type,
        parentId: parentId || null,
        isActive,
      },
    });

    await recordAuditLog({
      userId: caller.id,
      action: "ORGANIZATION_UNIT_UPDATED",
      resourceType: "ORGANIZATION_UNIT",
      resourceId: id,
      details: {
        name: updated.name,
        code: updated.code,
        type: updated.type,
        isActive: updated.isActive,
      },
    });

    revalidatePath("/admin/organization");
    revalidatePath(`/admin/organization/${id}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تعديل الوحدة الإدارية.",
    };
  }
}
