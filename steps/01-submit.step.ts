import { ApiRouteConfig } from "motia";

// Step - 1
// Accept channel name and email to start the workflow
export const config: ApiRouteConfig = {
    name: "SubmitChannel",
    type: "api",
    path: "/submit",
    method: "POST",
    emits: ["yt.submit"],
};

interface SubmitRequest {
    channel: string;
    email: string;
}

export const handler = async (req: any, { emit, logger, state }: any) => {
    try {
        logger.info("received submition request", { body: req.body });

        const { channel, email } = req.body as SubmitRequest;
        if (!channel || !email) {
            return {
                status: 400,
                body: {
                    error: "channel and email are required",
                },
            };
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return {
                status: 400,
                body: {
                    error: "invalid email format",
                },
            };
        }

        const jobId = `job_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 9)}`;

        await state.set(`job: ${jobId}`, {
            jobId,
            channel,
            email,
            status: "queued",
            createdAt: new Date().toISOString(),
        });

        logger.info("job created", { jobId, channel, email });

        await emit({
            topic: "yt.submit",
            data: {
                jobId,
                channel,
                email,
            },
        });

        return {
            status: 202,
            body: {
                success: true,
                jobId,
                message:
                    "your request has been queued. You will get an email soon with improved suggestions for your youtube videos",
            },
        };
    } catch (error: any) {
        logger.error("error in submission handler", { error: error.message });

        return {
            status: 500,
            body: {
                error: "internal server error",
            },
        };
    }
};
