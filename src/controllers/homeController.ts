import { Context } from "hono";

export const HomeController = {
  index: (c: Context) => {
    return c.json({
      message: "This is Strata Reserve Planning API server!",
      status: "200",
    });
  },
};
