"use client"

import React from "react"
import { useRouter } from "next/navigation"
import AuthForm from "@/components/auth-form"

export default function LoginPage() {
  const router = useRouter()

  function handleLogin(token: string) {
    try {
      localStorage.setItem("CIR_TOKEN", token)
    } catch (e) {}
    router.push("/dashboard")
  }

  return <AuthForm onLogin={handleLogin} />
}
