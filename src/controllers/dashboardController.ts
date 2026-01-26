import { Context } from "hono";

export const DashboardController = {
  index: (c: Context) => {
    return c.json({
      message: "This is Strata Reserve Planning API server!",
      status: "200",
    });
  },
};
