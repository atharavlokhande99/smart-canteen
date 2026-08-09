package com.canteen.model;

public class TimeSlot {
    private String slotId;
    private String startTime;
    private String endTime;
    private int maxCapacity;
    private int currentBookings;

    public TimeSlot(String slotId, String startTime, String endTime, int maxCapacity) {
        this.slotId = slotId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.maxCapacity = maxCapacity;
        this.currentBookings = 0;
    }

    public String getSlotId() { return slotId; }
    public String getStartTime() { return startTime; }
    public String getEndTime() { return endTime; }
    public int getMaxCapacity() { return maxCapacity; }
    public int getCurrentBookings() { return currentBookings; }

    public boolean hasAvailableSpace() {
        return currentBookings < maxCapacity;
    }

    public boolean bookSlot() {
        if (hasAvailableSpace()) {
            currentBookings++;
            return true;
        }
        return false;
    }

    @Override
    public String toString() {
        return "TimeSlot{" +
                "slotId='" + slotId + '\'' +
                ", time='" + startTime + "-" + endTime + '\'' +
                ", bookings=" + currentBookings + "/" + maxCapacity +
                '}';
    }
}
