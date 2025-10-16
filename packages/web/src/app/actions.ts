"use server"

import { createClient } from "@/utils/supabase/server"

export const getUserId = async (): Promise<string | null> => {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error
        } = await supabase.auth.getUser()

        if (error) {
            console.error("Supabase auth error:", error)
            return null
        }

        return user?.id ?? null
    } catch (error) {
        console.error("Error occurred:", error)
        return null
    }
}