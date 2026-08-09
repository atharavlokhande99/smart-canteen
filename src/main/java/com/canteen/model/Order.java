package com.canteen.model;

import java.util.List;

public class Order {
    private String orderId;
    private String userId;
    private List<MenuItem> items;
    private double totalAmount;
    private String slotId;
    private String status; // "PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"

    public Order(String orderId, String userId, List<MenuItem> items, double totalAmount, String slotId) {
        this.orderId = orderId;
        this.userId = userId;
        this.items = items;
        this.totalAmount = totalAmount;
        this.slotId = slotId;
        this.status = "PENDING";
    }

    public String getOrderId() { return orderId; }
    public String getUserId() { return userId; }
    public List<MenuItem> getItems() { return items; }
    public double getTotalAmount() { return totalAmount; }
    public String getSlotId() { return slotId; }
    public String getStatus() { return status; }

    public void setStatus(String status) { this.status = status; }

    @Override
    public String toString() {
        return "Order{" +
                "orderId='" + orderId + '\'' +
                ", userId='" + userId + '\'' +
                ", totalAmount=" + totalAmount +
                ", slotId='" + slotId + '\'' +
                ", status='" + status + '\'' +
                '}';
    }
}
