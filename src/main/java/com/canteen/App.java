package com.canteen;

import com.canteen.server.WebServer;
import com.canteen.service.CanteenService;

import java.awt.Desktop;
import java.net.URI;

public class App {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   🚀 SMART CANTEEN MANAGEMENT SYSTEM (JAVA)   ");
        System.out.println("==================================================");

        CanteenService canteenService = new CanteenService();
        WebServer server = new WebServer(8080, canteenService);

        try {
            server.start();
            System.out.println("✅ Web Server started successfully on port 8080!");
            System.out.println("👉 Opening http://localhost:8080 in your browser...");

            // Open browser only AFTER server port 8080 is 100% listening and ready!
            try {
                if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                    Desktop.getDesktop().browse(new URI("http://localhost:8080"));
                } else {
                    Runtime.getRuntime().exec("cmd /c start http://localhost:8080");
                }
            } catch (Exception ex) {
                Runtime.getRuntime().exec("cmd /c start http://localhost:8080");
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to start server: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
