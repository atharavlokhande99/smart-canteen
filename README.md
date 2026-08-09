# Smart Canteen Management System (Java & Maven)

A Java-based backend food pre-ordering and time-slot scheduling web application built for college canteens and campus food courts.

## 📌 Features
- **User Role Management**: Role-based access control for Students, Canteen Staff, and Admins.
- **Menu Catalog Management**: Real-time tracking of food item availability, pricing, and prep times.
- **Time-Slot Capacity Algorithm**: Prevents canteen rush by capping pickup orders per 15-minute slot.
- **Order Processing Pipeline**: Tracks order state transitions (`PENDING` -> `PREPARING` -> `READY_FOR_PICKUP` -> `COMPLETED`).

## 🛠️ Tech Stack
- **Language**: Java 17 / Object-Oriented Programming (OOP)
- **Build Tool**: Apache Maven (`pom.xml`)
- **Architecture**: Model-View-Service Layered Architecture
- **Data Persistence**: In-Memory / SQLite Database Integration (`sqlite-jdbc`)
- **JSON Serialization**: Google Gson

## 🚀 How to Run Locally

### Prerequisites
- JDK 17 or higher
- Apache Maven

### Build & Run Commands
```bash
# Compile and build the project
mvn clean compile

# Run the Java application
mvn exec:java -Dexec.mainClass="com.canteen.App"

# Run Unit Tests
mvn test
```
