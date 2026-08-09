package com.saas.platform.service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    @Value("${sendgrid.api-key:${SENDGRID_API_KEY:}}")
    private String sendGridApiKey;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${sendgrid.from-email:${SENDGRID_FROM_EMAIL:inapakolla.sai1@gmail.com}}")
    private String fromEmail;

    public void sendInvitationEmail(String toEmail, String token, String tenantName, String inviterName) {
        String inviteUrl = frontendUrl + "/accept-invite?token=" + token;

        if (sendGridApiKey == null || sendGridApiKey.isBlank()) {
            log.info("SENDGRID_API_KEY is not set. Generated local invitation link for {}: {}", toEmail, inviteUrl);
            return;
        }

        Email from = new Email(fromEmail); // Must be a verified Single Sender in SendGrid dashboard
        String subject = "You have been invited to join " + tenantName + " on TeamX";
        Email to = new Email(toEmail);

        String htmlContent = String.format(
                "<p>Hello,</p>" +
                "<p><strong>%s</strong> has invited you to join the team <strong>%s</strong> on TeamX.</p>" +
                "<p>Please click the link below to accept the invitation and set up your account:</p>" +
                "<p><a href=\"%s\">Accept Invitation</a></p>" +
                "<p>If you did not expect this invitation, you can safely ignore this email.</p>",
                inviterName != null ? inviterName : "An administrator", tenantName, inviteUrl);

        Content content = new Content("text/html", htmlContent);
        Mail mail = new Mail(from, subject, to, content);

        SendGrid sg = new SendGrid(sendGridApiKey);
        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);
            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("Sent invitation email to {}, status code: {}", toEmail, response.getStatusCode());
            } else {
                log.error("Failed to send email to {}. Status code: {}, Body: {}", toEmail, response.getStatusCode(), response.getBody());
            }
        } catch (IOException ex) {
            log.error("Failed to send email to {}", toEmail, ex);
        }
    }
}
