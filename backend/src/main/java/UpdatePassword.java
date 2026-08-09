import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.sql.*;

public class UpdatePassword {
    public static void main(String[] args) throws Exception {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        String newHash = encoder.encode("Password1234!");
        
        String url = "jdbc:sqlserver://my-databases.database.windows.net:1433;database=teamX;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30;";
        String user = "TeamX-Admin@my-databases";
        String password = "Inapakolla1";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             PreparedStatement stmt = conn.prepareStatement("UPDATE users SET password_hash = ? WHERE email = ?")) {
            
            stmt.setString(1, newHash);
            stmt.setString(2, "test@admin.com");
            int rows = stmt.executeUpdate();
            System.out.println("Updated rows for test@admin.com: " + rows);
            
            stmt.setString(1, newHash);
            stmt.setString(2, "Test@admin.com");
            int rows2 = stmt.executeUpdate();
            System.out.println("Updated rows for Test@admin.com: " + rows2);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
