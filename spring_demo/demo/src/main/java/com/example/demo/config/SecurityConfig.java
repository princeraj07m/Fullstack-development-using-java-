package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

import javax.sql.DataSource;

/**
 * JDBC Authentication: users and roles are stored in PLACEMENT database
 * (users and authorities tables). Public paths: /, /api/**.
 * All other paths require HTTP Basic auth with a user from the DB.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/", "/api/**").permitAll()
                        .anyRequest().authenticated()
                )
                .httpBasic(c -> {});
        return http.build();
    }

    @Bean
    public JdbcUserDetailsManager userDetailsManager(DataSource dataSource, PasswordEncoder passwordEncoder) {
        JdbcUserDetailsManager manager = new JdbcUserDetailsManager(dataSource);
        // Create default users only if they don't exist (e.g. first run without data-users.sql)
        if (!manager.userExists("user")) {
            UserDetails user = User.builder()
                    .username("user")
                    .password(passwordEncoder.encode("password"))
                    .roles("USER")
                    .build();
            manager.createUser(user);
        }
        if (!manager.userExists("admin")) {
            UserDetails admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("password"))
                    .roles("USER", "ADMIN")
                    .build();
            manager.createUser(admin);
        }
        return manager;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }
}
