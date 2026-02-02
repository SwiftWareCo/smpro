import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getRun } from "workflow/api";
import type { CrawlWorkflowResult } from "@/workflows/seo-crawl";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ runId: string }> },
) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { runId } = await params;

        if (!runId) {
            return NextResponse.json(
                { error: "Run ID is required" },
                { status: 400 },
            );
        }

        // Get workflow run status
        const run = await getRun<CrawlWorkflowResult>(runId);

        if (!run) {
            return NextResponse.json(
                { error: "Workflow run not found" },
                { status: 404 },
            );
        }

        // Await async properties from workflow run
        const runStatus = await run.status;
        const runOutput = await run.returnValue;

        // Map workflow status to client-friendly format
        // Map workflow status to client-friendly format
        const status = mapWorkflowStatus(runStatus);
        // Cast to any to access potential steps property if it exists on the run object or its state
        const steps = (run as any).steps || (run as any).state?.steps;
        const currentStep = getCurrentStep({ status: runStatus, steps });

        const response: {
            runId: string;
            status: string;
            currentStep: string | null;
            result?: CrawlWorkflowResult;
            error?: string;
        } = {
            runId,
            status,
            currentStep,
        };

        // Include result if completed
        if (runStatus === "completed" && runOutput) {
            response.result = runOutput;
        }

        // Include error if failed
        if (runStatus === "failed") {
            response.error = "Workflow failed";
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error("SEO crawl status error:", error);
        return NextResponse.json(
            { error: "Failed to get workflow status" },
            { status: 500 },
        );
    }
}

/**
 * Map workflow status to user-friendly status
 */
function mapWorkflowStatus(status: string): string {
    switch (status) {
        case "pending":
            return "pending";
        case "running":
            return "running";
        case "completed":
            return "completed";
        case "failed":
            return "failed";
        case "cancelled":
            return "cancelled";
        default:
            return "unknown";
    }
}

/**
 * Get current step name from workflow run
 */
function getCurrentStep(run: {
    status: string;
    steps?: Array<{ name: string; status: string }>;
}): string | null {
    if (run.status === "completed") {
        return "completed";
    }

    if (run.status === "failed") {
        return "failed";
    }

    // Try to determine current step from steps array if available
    if (run.steps && Array.isArray(run.steps)) {
        const runningStep = run.steps.find((s) => s.status === "running");
        if (runningStep) {
            return mapStepName(runningStep.name);
        }

        const lastCompletedStep = [...run.steps]
            .reverse()
            .find((s) => s.status === "completed");
        if (lastCompletedStep) {
            // Return the next step that should run
            const stepIndex = run.steps.indexOf(lastCompletedStep);
            if (stepIndex < run.steps.length - 1) {
                return mapStepName(run.steps[stepIndex + 1].name);
            }
        }
    }

    return "processing";
}

/**
 * Map step function names to user-friendly labels
 */
function mapStepName(name: string): string {
    if (name.includes("discover")) return "discovering";
    if (name.includes("scrape")) return "scraping";
    if (name.includes("aggregate")) return "aggregating";
    if (name.includes("analyze")) return "analyzing";
    return "processing";
}
