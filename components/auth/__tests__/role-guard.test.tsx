import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { RoleGuard } from "../role-guard"
import { useAuth } from "@/app/providers"
import userEvent from "@testing-library/user-event"
import '@testing-library/jest-dom'
import { IdTokenResult } from "firebase/auth"

jest.mock("@/app/providers")

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe("RoleGuard", () => {
  const TestComponent = () => <div>Protected Content</div>

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it("redirects to /auth if user is not logged in", async () => {
    mockUseAuth.mockReturnValue({ user: null, role: null, loading: false, token: null })

    const pushMock = jest.fn()
    jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({ push: pushMock } as any)

    render(
      <RoleGuard>
        <TestComponent />
      </RoleGuard>
    )

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/auth")
    })
  })

  it("renders children if user has required role", async () => {
    mockUseAuth.mockReturnValue({ user: {
      uid: "123", emailVerified: false, isAnonymous: false, metadata: {}, providerData: [],
      refreshToken: "",
      tenantId: null,
      delete: function (): Promise<void> {
        throw new Error("Function not implemented.")
      },
      getIdToken: function (forceRefresh?: boolean): Promise<string> {
        throw new Error("Function not implemented.")
      },
      getIdTokenResult: function (forceRefresh?: boolean): Promise<IdTokenResult> {
        throw new Error("Function not implemented.")
      },
      reload: function (): Promise<void> {
        throw new Error("Function not implemented.")
      },
      toJSON: function (): object {
        throw new Error("Function not implemented.")
      },
      displayName: null,
      email: null,
      phoneNumber: null,
      photoURL: null,
      providerId: ""
    }, role: "admin", loading: false, token: null })

    jest.spyOn(global, "fetch").mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/api/admin/check-role")) {
        return Promise.resolve({
          json: () => Promise.resolve({ role: "admin" }),
        } as Response)
      }
      if (typeof url === "string" && url.includes("/api/member/check-role")) {
        return Promise.resolve({
          json: () => Promise.resolve({ role: "member" }),
        } as Response)
      }
      return Promise.reject("Unknown URL")
    })

    render(
      <RoleGuard requiredRole="admin">
        <TestComponent />
      </RoleGuard>
    )

    expect(await screen.findByText("Protected Content")).toBeInTheDocument()
  })

  it("shows unauthorized message if user does not have required role", async () => {
    mockUseAuth.mockReturnValue({ user: {
      uid: "123", emailVerified: false, isAnonymous: false, metadata: {}, providerData: [],
      refreshToken: "",
      tenantId: null,
      delete: function (): Promise<void> {
        throw new Error("Function not implemented.")
      },
      getIdToken: function (forceRefresh?: boolean): Promise<string> {
        throw new Error("Function not implemented.")
      },
      getIdTokenResult: function (forceRefresh?: boolean): Promise<IdTokenResult> {
        throw new Error("Function not implemented.")
      },
      reload: function (): Promise<void> {
        throw new Error("Function not implemented.")
      },
      toJSON: function (): object {
        throw new Error("Function not implemented.")
      },
      displayName: null,
      email: null,
      phoneNumber: null,
      photoURL: null,
      providerId: ""
    }, role: "member", loading: false, token: null })

    jest.spyOn(global, "fetch").mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/api/admin/check-role")) {
        return Promise.resolve({
          json: () => Promise.resolve({ role: null }),
        } as Response)
      }
      if (typeof url === "string" && url.includes("/api/member/check-role")) {
        return Promise.resolve({
          json: () => Promise.resolve({ role: "member" }),
        } as Response)
      }
      return Promise.reject("Unknown URL")
    })

    render(
      <RoleGuard requiredRole="admin">
        <TestComponent />
      </RoleGuard>
    )

    expect(await screen.findByText("غير مصرح لك بالوصول")).toBeInTheDocument()
  })
})
