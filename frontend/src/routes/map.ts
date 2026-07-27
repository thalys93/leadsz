import type { RoutesGroup } from "@/types/routes.types"
import NotFoundPage from "@/pages/not-found"
import LoginPage from "@/pages/auth/login"
import RegisterPage from "@/pages/auth/register"
import InvitePage from "@/pages/auth/invite"
import ForgotPasswordPage from "@/pages/auth/forgot-password"
import ForgotPasswordCodePage from "@/pages/auth/forgot-password-code"
import ForgotPasswordResetPage from "@/pages/auth/forgot-password-reset"
import AppRedirectPage from "@/pages/app-redirect"
import DashboardPage from "@/pages/dashboard"
import LeadsPage from "@/pages/leads"
import LeadDetailPage from "@/pages/leads/detail"
import TemplatesPage from "@/pages/templates"
import TemplateFormPage from "@/pages/templates/form"
import ServicesPage from "@/pages/services"
import TeamPage from "@/pages/team"
import TestEmailPage from "@/pages/test-email"
import ProfilePage from "@/pages/profile"
import PrivateShell from "@/middleware/private-shell"

export const PublicRoutes: RoutesGroup = {
  prefix: "/",
  public: [
    { path: "", element: LoginPage },
    { path: "login", element: LoginPage },
    { path: "register", element: RegisterPage },
    { path: "forgot-password", element: ForgotPasswordPage },
    { path: "forgot-password/code", element: ForgotPasswordCodePage },
    { path: "forgot-password/reset", element: ForgotPasswordResetPage },
    { path: "invite/:token", element: InvitePage },
    { path: "invite", element: InvitePage },
  ],
}

export const AppRoutesGroup: RoutesGroup = {
  prefix: "/app",
  privateMiddleware: PrivateShell,
  private: [
    { path: "", element: AppRedirectPage },
    { path: "dashboard", element: DashboardPage },
    { path: "leads", element: LeadsPage },
    { path: "leads/:id", element: LeadDetailPage },
    { path: "services", element: ServicesPage },
    { path: "templates", element: TemplatesPage },
    { path: "templates/new", element: TemplateFormPage },
    { path: "templates/:id/edit", element: TemplateFormPage },
    { path: "team", element: TeamPage },
    { path: "test-email", element: TestEmailPage },
    { path: "profile", element: ProfilePage },
  ],
}

export const AllRoutes: RoutesGroup[] = [PublicRoutes, AppRoutesGroup]

export { NotFoundPage }
