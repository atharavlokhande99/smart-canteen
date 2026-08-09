package com.canteen.server;

import com.canteen.model.MenuItem;
import com.canteen.model.Order;
import com.canteen.model.TimeSlot;
import com.canteen.model.User;
import com.canteen.service.CanteenService;
import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class WebServer {
    private final int port;
    private final CanteenService canteenService;
    private final Gson gson = new Gson();

    public WebServer(int port, CanteenService canteenService) {
        this.port = port;
        this.canteenService = canteenService;
    }

    public void start() throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        // Web UI & API Endpoints
        server.createContext("/", new StaticFileHandler());
        server.createContext("/api/auth/login", new LoginHandler());
        server.createContext("/api/auth/register", new RegisterHandler());
        server.createContext("/api/menu", new MenuHandler());
        server.createContext("/api/slots", new SlotsHandler());
        server.createContext("/api/order", new OrderHandler());
        server.createContext("/api/verify-otp", new OtpVerifyHandler());

        server.setExecutor(null);
        server.start();
        System.out.println("🌐 Web Application Server running at: http://localhost:" + port);
    }

    // Serve HTML Web Interface
    private class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            InputStream is = getClass().getResourceAsStream("/web/index.html");
            if (is == null) {
                String response = "Error: Web UI file not found!";
                exchange.sendResponseHeaders(404, response.length());
                OutputStream os = exchange.getResponseBody();
                os.write(response.getBytes());
                os.close();
                return;
            }
            byte[] bytes = is.readAllBytes();
            exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
            exchange.sendResponseHeaders(200, bytes.length);
            OutputStream os = exchange.getResponseBody();
            os.write(bytes);
            os.close();
        }
    }

    // API: User Login
    private class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                InputStreamReader reader = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                Map<String, String> body = gson.fromJson(reader, Map.class);

                String emailOrId = body.get("email");
                String password = body.get("password");

                User user = canteenService.authenticateUser(emailOrId, password);
                if (user != null) {
                    Map<String, Object> resp = new HashMap<>();
                    resp.put("success", true);
                    resp.put("user", user);
                    sendJsonResponse(exchange, 200, gson.toJson(resp));
                } else {
                    Map<String, Object> err = new HashMap<>();
                    err.put("success", false);
                    err.put("message", "Invalid email/ID or password!");
                    sendJsonResponse(exchange, 401, gson.toJson(err));
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // API: User Registration
    private class RegisterHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                InputStreamReader reader = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                Map<String, String> body = gson.fromJson(reader, Map.class);

                String name = body.get("name");
                String email = body.get("email");
                String password = body.get("password");
                String role = body.get("role");

                String userId = "U-" + UUID.randomUUID().toString().substring(0, 6);
                User user = new User(userId, name, email, role != null ? role : "STUDENT");

                canteenService.registerUser(user, password);

                Map<String, Object> resp = new HashMap<>();
                resp.put("success", true);
                resp.put("user", user);
                sendJsonResponse(exchange, 200, gson.toJson(resp));
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // API: Get Menu
    private class MenuHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            List<MenuItem> menu = canteenService.getAvailableMenu();
            String json = gson.toJson(menu);
            sendJsonResponse(exchange, 200, json);
        }
    }

    // API: Get Time Slots
    private class SlotsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            List<TimeSlot> slots = canteenService.getTimeSlots();
            String json = gson.toJson(slots);
            sendJsonResponse(exchange, 200, json);
        }
    }

    // API: Place Order
    private class OrderHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                InputStreamReader reader = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                Map<String, Object> body = gson.fromJson(reader, Map.class);

                String userId = (String) body.get("userId");
                List<String> items = (List<String>) body.get("items");
                String slotId = (String) body.get("slotId");

                try {
                    Order order = canteenService.placeOrder(userId, items, slotId);
                    sendJsonResponse(exchange, 200, gson.toJson(order));
                } catch (Exception e) {
                    Map<String, String> err = Collections.singletonMap("error", e.getMessage());
                    sendJsonResponse(exchange, 400, gson.toJson(err));
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // API: Verify Pickup OTP
    private class OtpVerifyHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                InputStreamReader reader = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                Map<String, String> body = gson.fromJson(reader, Map.class);

                String orderId = body.get("orderId");
                String otp = body.get("otp");

                boolean success = canteenService.verifyPickupOtp(orderId, otp);
                Map<String, Object> resp = new HashMap<>();
                resp.put("success", success);
                resp.put("message", success ? "OTP Verified! Order Handed Over." : "Invalid OTP!");

                sendJsonResponse(exchange, success ? 200 : 400, gson.toJson(resp));
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    private void sendJsonResponse(HttpExchange exchange, int statusCode, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }
}
