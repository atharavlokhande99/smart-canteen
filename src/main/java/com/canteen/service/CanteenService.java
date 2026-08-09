package com.canteen.service;

import com.canteen.model.MenuItem;
import com.canteen.model.Order;
import com.canteen.model.TimeSlot;
import com.canteen.model.User;

import java.util.*;

public class CanteenService {
    private final Map<String, User> users = new HashMap<>();
    private final Map<String, MenuItem> menu = new LinkedHashMap<>();
    private final Map<String, TimeSlot> timeSlots = new LinkedHashMap<>();
    private final Map<String, Order> orders = new HashMap<>();
    private final Random random = new Random();

    public CanteenService() {
        initSampleData();
    }

    private void initSampleData() {
        // 🍳 Breakfast / Morning
        menu.put("ITEM1", new MenuItem("ITEM1", "Poha", "Breakfast", 20.0, true));
        menu.put("ITEM2", new MenuItem("ITEM2", "Upma", "Breakfast", 20.0, true));
        menu.put("ITEM3", new MenuItem("ITEM3", "Misal Pav", "Breakfast", 40.0, true));
        menu.put("ITEM4", new MenuItem("ITEM4", "Vada Pav", "Breakfast", 15.0, true));
        menu.put("ITEM5", new MenuItem("ITEM5", "Idli Sambar", "Breakfast", 30.0, true));
        menu.put("ITEM6", new MenuItem("ITEM6", "Medu Vada", "Breakfast", 30.0, true));
        menu.put("ITEM7", new MenuItem("ITEM7", "Sabudana Khichdi", "Breakfast", 35.0, true));
        menu.put("ITEM8", new MenuItem("ITEM8", "Tea", "Breakfast", 10.0, true));
        menu.put("ITEM9", new MenuItem("ITEM9", "Coffee", "Breakfast", 15.0, true));

        // 🍔 Snacks & Fast Food
        menu.put("ITEM10", new MenuItem("ITEM10", "Samosa", "Snacks", 15.0, true));
        menu.put("ITEM11", new MenuItem("ITEM11", "Kanda Bhaji", "Snacks", 25.0, true));
        menu.put("ITEM12", new MenuItem("ITEM12", "Bread Pakoda", "Snacks", 20.0, true));
        menu.put("ITEM13", new MenuItem("ITEM13", "Veg Sandwich", "Snacks", 40.0, true));
        menu.put("ITEM14", new MenuItem("ITEM14", "Cheese Sandwich", "Snacks", 50.0, true));
        menu.put("ITEM15", new MenuItem("ITEM15", "Veg Grilled Sandwich", "Snacks", 60.0, true));
        menu.put("ITEM16", new MenuItem("ITEM16", "Maggi", "Snacks", 30.0, true));
        menu.put("ITEM17", new MenuItem("ITEM17", "Cheese Maggi", "Snacks", 45.0, true));
        menu.put("ITEM18", new MenuItem("ITEM18", "Veg Momos", "Snacks", 50.0, true));
        menu.put("ITEM19", new MenuItem("ITEM19", "French Fries", "Snacks", 50.0, true));
        menu.put("ITEM20", new MenuItem("ITEM20", "Frankie", "Snacks", 50.0, true));

        // 🍕 College Favorites
        menu.put("ITEM21", new MenuItem("ITEM21", "Veg Cheese Pizza", "College Favorites", 80.0, true));
        menu.put("ITEM22", new MenuItem("ITEM22", "Paneer Pizza", "College Favorites", 100.0, true));
        menu.put("ITEM23", new MenuItem("ITEM23", "Veg Burger", "College Favorites", 60.0, true));
        menu.put("ITEM24", new MenuItem("ITEM24", "Cheese Burger", "College Favorites", 70.0, true));
        menu.put("ITEM25", new MenuItem("ITEM25", "Paneer Burger", "College Favorites", 80.0, true));
        menu.put("ITEM26", new MenuItem("ITEM26", "Masala Pav", "College Favorites", 40.0, true));
        menu.put("ITEM27", new MenuItem("ITEM27", "Pav Bhaji", "College Favorites", 60.0, true));

        // 🍛 Proper Lunch
        menu.put("ITEM28", new MenuItem("ITEM28", "Dal Rice", "Proper Lunch", 50.0, true));
        menu.put("ITEM29", new MenuItem("ITEM29", "Dal Khichdi", "Proper Lunch", 50.0, true));
        menu.put("ITEM30", new MenuItem("ITEM30", "Veg Thali", "Proper Lunch", 70.0, true));
        menu.put("ITEM31", new MenuItem("ITEM31", "Paneer Thali", "Proper Lunch", 90.0, true));
        menu.put("ITEM32", new MenuItem("ITEM32", "Rajma Rice", "Proper Lunch", 60.0, true));
        menu.put("ITEM33", new MenuItem("ITEM33", "Chole Rice", "Proper Lunch", 60.0, true));
        menu.put("ITEM34", new MenuItem("ITEM34", "Veg Biryani", "Proper Lunch", 70.0, true));
        menu.put("ITEM35", new MenuItem("ITEM35", "Paneer Biryani", "Proper Lunch", 90.0, true));
        menu.put("ITEM36", new MenuItem("ITEM36", "Roti + Sabzi", "Proper Lunch", 50.0, true));

        // 🥤 Drinks
        menu.put("ITEM37", new MenuItem("ITEM37", "Lemon Water", "Drinks", 20.0, true));
        menu.put("ITEM38", new MenuItem("ITEM38", "Masala Chaas", "Drinks", 20.0, true));
        menu.put("ITEM39", new MenuItem("ITEM39", "Cold Coffee", "Drinks", 50.0, true));
        menu.put("ITEM40", new MenuItem("ITEM40", "Mango Shake", "Drinks", 50.0, true));
        menu.put("ITEM41", new MenuItem("ITEM41", "Chocolate Shake", "Drinks", 60.0, true));
        menu.put("ITEM42", new MenuItem("ITEM42", "Soft Drink", "Drinks", 30.0, true));
        menu.put("ITEM43", new MenuItem("ITEM43", "Water Bottle", "Drinks", 20.0, true));

        // Time slots
        timeSlots.put("SLOT1", new TimeSlot("SLOT1", "08:30 AM", "09:30 AM", 15));
        timeSlots.put("SLOT2", new TimeSlot("SLOT2", "11:00 AM", "12:00 PM", 15));
        timeSlots.put("SLOT3", new TimeSlot("SLOT3", "12:30 PM", "01:30 PM", 20));
        timeSlots.put("SLOT4", new TimeSlot("SLOT4", "04:00 PM", "05:00 PM", 15));
    }

    public void registerUser(User user) {
        users.put(user.getUserId(), user);
    }

    public List<MenuItem> getAvailableMenu() {
        List<MenuItem> availableItems = new ArrayList<>();
        for (MenuItem item : menu.values()) {
            if (item.isAvailable()) {
                availableItems.add(item);
            }
        }
        return availableItems;
    }

    public List<TimeSlot> getTimeSlots() {
        return new ArrayList<>(timeSlots.values());
    }

    public Order placeOrder(String userId, List<String> itemIds, String slotId) {
        TimeSlot slot = timeSlots.get(slotId);
        if (slot == null || !slot.hasAvailableSpace()) {
            throw new IllegalArgumentException("Selected time slot is unavailable or full!");
        }

        List<MenuItem> orderItems = new ArrayList<>();
        double total = 0.0;

        for (String id : itemIds) {
            MenuItem item = menu.get(id);
            if (item != null && item.isAvailable()) {
                orderItems.add(item);
                total += item.getPrice();
            }
        }

        if (orderItems.isEmpty()) {
            throw new IllegalArgumentException("No valid menu items selected!");
        }

        slot.bookSlot();

        String pickupOtp = String.format("%04d", random.nextInt(10000));
        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8);

        Order newOrder = new Order(orderId, userId, orderItems, total, slotId, pickupOtp);
        orders.put(orderId, newOrder);

        return newOrder;
    }

    public Order updateOrderStatus(String orderId, String newStatus) {
        Order order = orders.get(orderId);
        if (order != null) {
            order.setStatus(newStatus);
        }
        return order;
    }

    public boolean verifyPickupOtp(String orderId, String inputOtp) {
        Order order = orders.get(orderId);
        if (order == null) {
            System.out.println("❌ Order Error: Order ID " + orderId + " not found!");
            return false;
        }

        if (order.getPickupOtp().equals(inputOtp)) {
            order.setOtpVerified(true);
            order.setStatus("COMPLETED");
            System.out.println("✅ OTP Verified Successfully! Food Order Handed Over to Student.");
            return true;
        } else {
            System.out.println("❌ OTP Verification Failed! Invalid OTP provided for Order " + orderId);
            return false;
        }
    }

    public List<Order> getUserOrders(String userId) {
        List<Order> userOrders = new ArrayList<>();
        for (Order o : orders.values()) {
            if (o.getUserId().equals(userId)) {
                userOrders.add(o);
            }
        }
        return userOrders;
    }
}
