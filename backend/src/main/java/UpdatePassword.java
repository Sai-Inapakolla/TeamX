import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.io.File;
import java.nio.file.Files;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class UpdatePassword {

    public static void main(String[] args) {
        Map<String, String> env = loadEnv();

        String url = getEnvOrProperty(env, "SPRING_DATASOURCE_URL");
        String user = getEnvOrProperty(env, "SPRING_DATASOURCE_USERNAME");
        String password = getEnvOrProperty(env, "SPRING_DATASOURCE_PASSWORD");

        if (url == null || user == null || password == null) {
            System.err.println("Error: Database credentials (SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME, SPRING_DATASOURCE_PASSWORD) not found in environment or .env file.");
            System.exit(1);
        }

        String rawPassword = args.length > 0 ? args[0] : getEnvOrProperty(env, "NEW_PASSWORD", "Password1234!");
        String email = args.length > 1 ? args[1] : getEnvOrProperty(env, "TARGET_EMAIL", "test@admin.com");

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        String newHash = encoder.encode(rawPassword);

        try (Connection conn = DriverManager.getConnection(url, user, password);
             PreparedStatement stmt = conn.prepareStatement("UPDATE users SET password_hash = ? WHERE LOWER(email) = LOWER(?)")) {

            stmt.setString(1, newHash);
            stmt.setString(2, email);
            int rows = stmt.executeUpdate();
            System.out.println("Updated " + rows + " row(s) for email: " + email);
        } catch (Exception e) {
            System.err.println("Failed to update password: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static String getEnvOrProperty(Map<String, String> env, String key) {
        return getEnvOrProperty(env, key, null);
    }

    private static String getEnvOrProperty(Map<String, String> env, String key, String defaultValue) {
        if (System.getProperty(key) != null && !System.getProperty(key).isBlank()) {
            return System.getProperty(key);
        }
        if (System.getenv(key) != null && !System.getenv(key).isBlank()) {
            return System.getenv(key);
        }
        if (env.containsKey(key) && !env.get(key).isBlank()) {
            return env.get(key);
        }
        return defaultValue;
    }

    private static Map<String, String> loadEnv() {
        Map<String, String> envMap = new HashMap<>();
        String[] candidates = {".env", "backend/.env", "../.env"};
        for (String candidate : candidates) {
            File file = new File(candidate);
            if (file.exists() && file.isFile()) {
                try {
                    List<String> lines = Files.readAllLines(file.toPath());
                    for (String line : lines) {
                        line = line.trim();
                        if (!line.isEmpty() && !line.startsWith("#") && line.contains("=")) {
                            String[] parts = line.split("=", 2);
                            String k = parts[0].trim();
                            String v = parts[1].trim();
                            if ((v.startsWith("\"") && v.endsWith("\"")) || (v.startsWith("'") && v.endsWith("'"))) {
                                v = v.substring(1, v.length() - 1);
                            }
                            envMap.putIfAbsent(k, v);
                        }
                    }
                    break;
                } catch (Exception e) {
                    System.err.println("Warning: Could not read " + candidate + ": " + e.getMessage());
                }
            }
        }
        return envMap;
    }
}
