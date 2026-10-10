package com.ampacash.creatorhub.model;
import jakarta.persistence.*;
@Embeddable
public class MediaFile {
    private String name;
    private Long size;
    private String type;
    protected MediaFile() {}
    public MediaFile(String name, Long size, String type) { this.name=name; this.size=size; this.type=type; }
    public String getName() { return name; }
    public Long getSize() { return size; }
    public String getType() { return type; }
}
