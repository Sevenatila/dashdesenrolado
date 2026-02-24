import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/api/sync/:path*",
        "/api/meta/:path*",
        "/api/vturb/:path*",
    ],
};
