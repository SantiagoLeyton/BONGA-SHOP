package com.bongashop.backend.auth.passwordreset.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Abstracción de envío de correo. Si hay un {@link JavaMailSender} en el
 * contexto (es decir, {@code spring.mail.host} configurado) lo usa; en caso
 * contrario registra el contenido del correo en logs (modo dev). Nunca lanza
 * excepciones hacia afuera: el flujo de reset de contraseña no debe romperse
 * por un fallo de SMTP.
 */
@Service
public class MailerService {

    private static final Logger LOGGER = LoggerFactory.getLogger(MailerService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String fromAddress;

    public MailerService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.mail.from:no-reply@bonga.shop}") String fromAddress
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.fromAddress = fromAddress;
    }

    public void sendPasswordResetEmail(String to, String name, String resetLink) {
        String subject = "Restablece tu contraseña — BONGA SHOP";
        String body = buildBody(name, resetLink);

        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            LOGGER.warn("""
                    [MAIL-DEV] spring.mail no está configurado. Correo NO enviado por SMTP.
                    -----------------------------------------------------------------
                    Para: {}
                    Asunto: {}
                    Enlace: {}
                    Cuerpo:
                    {}
                    -----------------------------------------------------------------
                    """, to, subject, resetLink, body);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        try {
            sender.send(message);
            LOGGER.info("Password reset email sent to {}", to);
        } catch (MailException exception) {
            LOGGER.error("Failed to send password reset email to {}: {}", to, exception.getMessage());
        }
    }

    private String buildBody(String name, String resetLink) {
        String greeting = (name == null || name.isBlank()) ? "Hola" : "Hola " + name;
        return """
                %s,

                Recibimos una solicitud para restablecer la contraseña de tu cuenta en BONGA SHOP.
                Si fuiste tú, abre el siguiente enlace para elegir una nueva contraseña:

                %s

                Este enlace es válido durante 1 hora. Si no solicitaste el cambio,
                puedes ignorar este mensaje con tranquilidad: tu contraseña no se modificó.

                — Equipo BONGA SHOP
                """.formatted(greeting, resetLink);
    }
}
