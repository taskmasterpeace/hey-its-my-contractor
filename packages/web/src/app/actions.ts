"use server"

import { createClient } from "@/utils/supabase/server";

export const getUserId = async () => {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        return user?.id;
    } catch (error) {
        console.error("error occurred", error)
        return null;
    }
}