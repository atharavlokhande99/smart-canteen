package com.canteen;

import com.canteen.model.MenuItem;
import com.canteen.model.Order;
import com.canteen.model.TimeSlot;
import com.canteen.model.User;
import com.canteen.service.CanteenService;

import java.util.Arrays;
import java.util.List;

public class App {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   SMART CANTEEN MANAGEMENT SYSTEM (JAVA)   ");
        System.out.println("==================================================\n");

        CanteenService canteenService = new CanteenService();

        // 1. Register User
        User student = new User("U101", "Atharav Lokhande", "atharavlokhande99@gmail.com", "STUDENT");
        canteenService.registerUser(student);
        System.out.println("Registered User: " + student.getName() + " (" + student.getRole() + ")");

        // 2. View Available Menu
        System.out.println("\n--- Available Canteen Menu ---");
        List<MenuItem> menu = canteenService.getAvailableMenu();
        for (MenuItem item : menu) {
            System.out.println(" • " + item.getName() + " [" + item.getCategory() + "] - ₹" + item.getPrice());
        }

        // 3. View Time Slots
        System.out.println("\n--- Available Pickup Time Slots ---");
        List<TimeSlot> slots = canteenService.getTimeSlots();
        for (TimeSlot slot : slots) {
            System.out.println(" • " + slot);
        }

        // 4. Place an Order
        System.out.println("\n--- Placing Order ---");
        List<String> selectedItems = Arrays.asList("ITEM1", "ITEM3"); // Veg Thali + Cold Coffee
        Order order = canteenService.placeOrder(student.getUserId(), selectedItems, "SLOT1");
        System.out.println("Order Placed Successfully!");
        System.out.println("Order Details: " + order);

        // 5. Update Order Status by Staff
        System.out.println("\n--- Staff Operations ---");
        canteenService.updateOrderStatus(order.getOrderId(), "PREPARING");
        System.out.println("Updated Order Status: " + order.getStatus());

        canteenService.updateOrderStatus(order.getOrderId(), "READY_FOR_PICKUP");
        System.out.println("Updated Order Status: " + order.getStatus());

        System.out.println("\n==================================================");
        System.out.println("   Canteen System Application Running Cleanly!   ");
        System.out.println("==================================================");
    }
}
