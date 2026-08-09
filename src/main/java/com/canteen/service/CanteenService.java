package com.canteen.service;

import com.canteen.model.MenuItem;
import com.canteen.model.Order;
import com.canteen.model.TimeSlot;
import com.canteen.model.User;

import java.util.*;

public class CanteenService {
    private final Map<String, User> users = new HashMap<>();
    private final Map<String, MenuItem> menu = new HashMap<>();
    private final Map<String, TimeSlot> timeSlots = new HashMap<>();
    private final Map<String, Order> orders = new HashMap<>();

    public CanteenService() {
        // Initialize default canteen data
        initSampleData();
    }

    private void initSampleData() {
        // Add sample menu items
        menu.put("ITEM1", new MenuItem("ITEM1", "Veg Thali", "Lunch", 120.0, true));
        menu.put("ITEM2", new MenuItem("ITEM2", "Paneer Wrap", "Snacks", 80.0, true));
        menu.put("ITEM3", new MenuItem("ITEM3", "Cold Coffee", "Beverages", 50.0, true));
        menu.put("ITEM4", new MenuItem("ITEM4", "Samosa (2 pcs)", "Snacks", 30.0, true));

        // Add sample time slots
        timeSlots.put("SLOT1", new TimeSlot("SLOT1", "12:00 PM", "12:30 PM", 10));
        timeSlots.put("SLOT2", new TimeSlot("SLOT2", "12:30 PM", "01:00 PM", 10));
        timeSlots.put("SLOT3", new TimeSlot("SLOT3", "01:00 PM", "01:30 PM", 10));
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

        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8);
        Order newOrder = new Order(orderId, userId, orderItems, total, slotId);
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
