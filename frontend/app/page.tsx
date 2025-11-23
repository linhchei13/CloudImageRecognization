"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    try {
      const t = typeof window !== "undefined" ? localStorage.getItem("CIR_TOKEN") : null
      if (t) router.replace("/dashboard")
      else router.replace("/login")
    } catch (e) {
      router.replace("/login")
    }
  }, [router])

  return null
}
// }
// "use client"

// import { useState, useEffect } from "react"
// import AuthForm from "@/components/auth-form"
// import Dashboard from "@/components/dashboard"

// export default function Page() {
//   const [token, setToken] = useState<string>("")
//   const [isLoading, setIsLoading] = useState(true)

//   useEffect(() => {
//     // Check for token in localStorage
//     const savedToken = localStorage.getItem("auth_token")
//     if (savedToken) {
//       setToken(savedToken)
//     }
//     setIsLoading(false)
//   }, [])

//   const handleLogin = (newToken: string) => {
//     setToken(newToken)
//     localStorage.setItem("auth_token", newToken)
//   }

//   const handleLogout = () => {
//     setToken("")
//     localStorage.removeItem("auth_token")
//   }

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex items-center justify-center">
//         <div className="text-center">
//           <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
//           <p className="mt-4 text-muted-foreground">Loading...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
//       {token ? <Dashboard token={token} onLogout={handleLogout} /> : <AuthForm onLogin={handleLogin} />}
//     </div>
//   )
// }
