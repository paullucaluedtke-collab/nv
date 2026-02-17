import { supabase } from "./supabaseClient";

export async function uploadProfileImage(userId: string, file: File): Promise<string | null> {
  try {
    // Validate file
    if (!file || file.size === 0) {
      throw new Error("Datei ist leer oder ungültig");
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("Bild ist zu groß (max. 5MB)");
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error("Datei muss ein Bild sein");
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${userId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('user-profile-images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("[profileImageUpload] Upload failed:", uploadError);
      throw new Error(uploadError.message || "Upload fehlgeschlagen");
    }

    const { data } = supabase.storage
      .from('user-profile-images')
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error("Öffentliche URL konnte nicht generiert werden");
    }

    return data.publicUrl;
  } catch (err: any) {
    console.error("[profileImageUpload] Error:", err);
    throw err; // Re-throw so the modal can handle it
  }
}

export async function uploadGalleryImage(userId: string, file: File): Promise<string | null> {
  try {
    if (!file || file.size === 0) {
      throw new Error("Datei ist leer oder ungültig");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Datei muss ein Bild sein");
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("Bild ist zu groß (max. 5MB)");
    }

    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `gallery/${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("user-profile-images").upload(filePath, file, {
      upsert: false,
      cacheControl: "3600",
    });

    if (uploadError) {
      console.error("[profileImageUpload] Gallery upload failed:", uploadError);
      throw new Error(uploadError.message || "Upload fehlgeschlagen");
    }

    const { data } = supabase.storage.from("user-profile-images").getPublicUrl(filePath);
    if (!data?.publicUrl) {
      throw new Error("Öffentliche URL konnte nicht generiert werden");
    }

    return data.publicUrl;
  } catch (err: any) {
    console.error("[profileImageUpload] Gallery Error:", err);
    throw err;
  }
}

