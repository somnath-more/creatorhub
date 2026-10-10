package com.ampacash.creatorhub.service.impl;
import com.ampacash.creatorhub.service.AccountMailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
@Service
public class AccountMailServiceImpl implements AccountMailService {
    private final JavaMailSender mail;
    private final String from;
    public AccountMailServiceImpl(JavaMailSender mail, @Value("${app.recovery.from:no-reply@creatorhub.local}") String from) { this.mail=mail; this.from=from; }
    @Override public void send(String email, String subject, String link) {
        var message = new SimpleMailMessage();
        message.setFrom(from); message.setTo(email); message.setSubject(subject);
        message.setText(subject+"\n\nOpen this single-use link and confirm the action:\n"+link+"\n\nIf you did not request this, ignore this email.");
        mail.send(message);
    }
}
