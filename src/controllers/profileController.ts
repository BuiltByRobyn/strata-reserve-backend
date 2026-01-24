import { Context } from "hono";

export const ProfileController = {
    index: (c: Context) => {
        return c.json({
            message: "This is Strata Reserve Planning Profile page!",
            status: "200",
        });
    },
};