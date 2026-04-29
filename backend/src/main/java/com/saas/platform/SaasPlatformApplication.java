package com.saas.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
// TODO: Uncomment when MongoDB is configured
// import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing
// @EnableMongoAuditing // TODO: Uncomment when MongoDB is configured
@EnableAsync
@EnableScheduling
public class SaasPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(SaasPlatformApplication.class, args);
    }
}
