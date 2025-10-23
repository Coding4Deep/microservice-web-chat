package com.chat.userservice.controller;

import com.chat.userservice.entity.User;
import com.chat.userservice.service.UserService;
import com.chat.userservice.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        try {
            User user = userService.registerUser(
                request.get("username"),
                request.get("email"),
                request.get("password")
            );
            Map<String, Object> response = new HashMap<>();
            response.put("message", "User registered successfully");
            response.put("userId", user.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        Optional<User> user = userService.authenticateUser(
            request.get("username"),
            request.get("password")
        );
        
        if (user.isPresent()) {
            String token = jwtUtil.generateToken(user.get().getUsername());
            userService.updateUserActivity(user.get().getUsername(), true);
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("username", user.get().getUsername());
            response.put("userId", user.get().getId());
            return ResponseEntity.ok(response);
        }
        
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid credentials"));
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.replace("Bearer ", "");
            String username = jwtUtil.extractUsername(jwt);
            userService.updateUserActivity(username, false);
            return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid token"));
        }
    }
    
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        List<User> users = userService.getAllUsers();
        Map<String, Object> response = new HashMap<>();
        response.put("totalUsers", userService.getTotalUsers());
        response.put("activeUsers", userService.getActiveUsers());
        response.put("users", users.stream().map(user -> {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("username", user.getUsername());
            userMap.put("email", user.getEmail());
            userMap.put("active", user.isActive());
            userMap.put("lastSeen", user.getLastSeen());
            return userMap;
        }).toList());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.replace("Bearer ", "");
            if (jwtUtil.isTokenValid(jwt)) {
                String username = jwtUtil.extractUsername(jwt);
                return ResponseEntity.ok(Map.of("valid", true, "username", username));
            }
        } catch (Exception e) {
            // Token invalid
        }
        return ResponseEntity.ok(Map.of("valid", false));
    }
}
