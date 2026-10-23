import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/db/prisma";
import { requireRole } from "@/lib/rbac/guards";
import { FindingDetailClient } from "@/components/agent/audit/FindingDetailClient";
import { FindingType, FindingSeverity, FindingStatus } from "@/lib/audit/types";

export const metadata: Metadata = {
  title: "تفاصيل الملاحظة الرقابية — التدقيق الذكي — أكاديميا شفاف",
  description: "معاينة الخلل المرصود والتحليل الاستشاري بالذكاء الاصطناعي واتخاذ القرار البشري",
};

interface FindingDetailPageProps {
  params: Promise<{ id: string; findingId: string }>;
}

export default async function FindingDetailPage({
  params,
}: FindingDetailPageProps) {
  await requireRole(["AGENT_RH", "ADMIN"]);
  const { id: batchId, findingId } = await params;

  const finding = await prisma.auditFinding.findUnique({
    where: { id: findingId },
    include: {
      batch: {
        include: {
          period: true,
        },
      },
      employee: {
        include: {
          organizationUnit: true,
        },
      },
      resolvedByUser: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      aiAnalyses: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!finding || finding.batchId !== batchId) {
    notFound();
  }

  const findingData = {
    id: finding.id,
    batchId: finding.batchId,
    type: finding.type as FindingType,
    severity: finding.severity as FindingSeverity,
    title: finding.title,
    description: finding.description,
    detectedValue: finding.detectedValue,
    expectedValue: finding.expectedValue,
    status: finding.status as FindingStatus,
    source: finding.source,
    confidence: finding.confidence,
    createdAt: finding.createdAt,
    resolvedAt: finding.resolvedAt,
    resolutionNote: finding.resolutionNote,
    resolvedByUser: finding.resolvedByUser,
    batch: {
      id: finding.batch.id,
      versionNumber: finding.batch.versionNumber,
      period: {
        label: finding.batch.period.label,
      },
    },
    employee: finding.employee
      ? {
          id: finding.employee.id,
          matricule: finding.employee.matricule,
          firstName: finding.employee.firstName,
          lastName: finding.employee.lastName,
          grade: finding.employee.grade,
          baseSalary: Number(finding.employee.baseSalary),
          rib: finding.employee.rib,
          organizationUnit: finding.employee.organizationUnit
            ? { name: finding.employee.organizationUnit.name }
            : null,
        }
      : null,
    aiAnalyses: finding.aiAnalyses.map((a) => {
      let parsedCauses: string[] = [];
      try {
        if (a.possibleCauses) {
          parsedCauses = JSON.parse(a.possibleCauses);
        }
      } catch {
        parsedCauses = [];
      }

      return {
        id: a.id,
        model: a.model,
        analysis: a.analysis,
        recommendation: a.recommendation,
        confidence: a.confidence,
        possibleCauses: parsedCauses,
        createdAt: a.createdAt,
      };
    }),
  };

  return <FindingDetailClient finding={findingData} />;
}
