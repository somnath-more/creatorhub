package com.ampacash.creatorhub.exception;
import org.springframework.http.HttpStatus;
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String code;
    public ApiException(HttpStatus status, String message) { this(status,message,null); }
    public ApiException(HttpStatus status, String message,String code) { super(message); this.status = status; this.code=code; }
    public String getCode() { return code; }
    public HttpStatus getStatus() { return status; }
}
