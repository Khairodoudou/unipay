import { z } from "zod";

/**
 * Schéma de sortie validé pour l'analyse IA d'une anomalie de paie
 */
export const aiAnalysisOutputSchema = z.object({
  analysis: z.string().min(5, "التحليل يجب أن يحتوي على شرح واضح"),
  possibleCauses: z
    .array(z.string().min(2))
    .min(1, "يجب تحديد سبب محتمل واحد على الأقل"),
  recommendation: z.string().min(5, "يجب تقديم توصية تدقيقية إنسانية"),
  confidence: z
    .number()
    .min(0, "نسبة الثقة يجب أن تكون بين 0 و 1")
    .max(1, "نسبة الثقة يجب أن تكون بين 0 و 1"),
});

export type AIAnalysisOutput = z.infer<typeof aiAnalysisOutputSchema>;

/**
 * Contexte minimal transmis à l'IA (Minimisation des données)
 * AUCUN secret, mot de passe, token, ou donnée confidentielle superflue
 */
export interface AIMinimalAuditContext {
  findingId: string;
  anomalyType: string;
  severity: string;
  title: string;
  description: string;
  detectedValue?: string | null;
  expectedValue?: string | null;
  employeeContext?: {
    matricule: string;
    grade?: string | null;
    department?: string | null;
    baseSalary?: number | null;
  } | null;
  payrollContext?: {
    periodLabel: string;
    batchVersion: number;
    currentNet?: number | null;
    currentGross?: number | null;
    workingDays?: number | null;
    presentDays?: number | null;
    absentDays?: number | null;
    allowancesCount?: number | null;
  } | null;
  historicalComparison?: {
    previousNet?: number | null;
    previousGross?: number | null;
    variationPercent?: number | null;
  } | null;
}
