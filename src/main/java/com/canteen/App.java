package com.canteen;

import com.canteen.model.User;
import com.canteen.server.WebServer;
import com.canteen.service.CanteenService;

import java.awt.Desktop;
import java.net.URI;

public class App {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   SMART CANTEEN WEB APPLICATION SERVER (JAVA)    ");
        System.out.println("==================================================\n");

        CanteenService canteenService = new CanteenService();

        // Register default user for web UI
        User student = new User("U101", "Atharav Lokhande", "atharavlokhande99@gmail.com", "STUDENT");
        canteenService.registerUser(student);

        int port = 8080;
        try {
            WebServer webServer = new WebServer(port, canteenService);
            webServer.start();

            String webUrl = "http://localhost:" + port;
            System.out.println("\n🚀 Success! Opening Web Application in Browser: " + webUrl);

            // Automatically open default web browser
            try {
                if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                    Desktop.getDesktop().browse(new URI(webUrl));
                } else {
                    Runtime.getRuntime().exec("cmd /c start " + webUrl);
                }
            } catch (Exception e) {
                System.out.println("Note: Please open " + webUrl + " manually in your browser!");
            }

            System.out.println("\n[PRESS CTRL+C IN TERMINAL TO STOP THE SERVER]");
        } catch (Exception e) {
            System.err.println("❌ Failed to start Web Application Server: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
