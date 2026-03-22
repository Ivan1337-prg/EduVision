from math import radians, sin, cos, sqrt, atan2

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371000  # Earth radius in meters

    phi1 = radians(lat1)
    phi2 = radians(lat2)

    delta_phi = radians(lat2 - lat1)
    delta_lambda = radians(lon2 - lon1)

    a = sin(delta_phi/2)**2 + cos(phi1)*cos(phi2)*sin(delta_lambda/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c

def is_valid_location(user_lat, user_lon, target_lat, target_lon, radius=5):
    distance = calculate_distance(user_lat, user_lon, target_lat, target_lon)
    return distance <= radius

# Demo test
if __name__ == "__main__":
    user_lat = 32.9412
    user_lon = -97.1342

    target_lat = 32.9410
    target_lon = -97.1340

    if is_valid_location(user_lat, user_lon, target_lat, target_lon):
        print("VALID ATTENDANCE")
    else:
        print("OUTSIDE RANGE")
      
