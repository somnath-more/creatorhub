package com.ampacash.creatorhub.dto;
import jakarta.validation.constraints.*;
import com.ampacash.creatorhub.model.MediaFile;
public record MediaMetadata(@NotBlank @Size(max=255) String name,
        @NotNull @Positive @Max(2147483648L) Long size, @NotBlank @Size(max=100) String type) {
    public MediaFile toModel() { return new MediaFile(name,size,type); }
    public static MediaMetadata from(MediaFile file) { return file==null ? null : new MediaMetadata(file.getName(),file.getSize(),file.getType()); }
}
