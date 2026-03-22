<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Geo Attendance Demo</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin-top: 80px;
            background-color: #f5f5f5;
        }

        h1 {
            margin-bottom: 10px;
        }

        button {
            padding: 12px 20px;
            font-size: 16px;
            cursor: pointer;
            border: none;
            background-color: #007BFF;
            color: white;
            border-radius: 5px;
        }

        button:hover {
            background-color: #0056b3;
        }

        #result {
            margin-top: 25px;
            font-size: 18px;
        }
    </style>
</head>
<body>

    <h1>Geo Attendance Check</h1>
    <p>Click the button to verify your location</p>

    <button onclick="getLocation()">Check Attendance</button>

    <div id="result"></div>

    <script>
        const CLASS_LAT = 32.9410;
        const CLASS_LON = -97.1340;

        function calculateDistance(lat1, lon1, lat2, lon2) {
            const R = 6371000;
            const toRad = x => x * Math.PI / 180;

            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);

            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);

            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        }

        function getLocation() {
            const output = document.getElementById("result");

            if (!navigator.geolocation) {
                output.innerHTML = "Geolocation is not supported.";
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLon = position.coords.longitude;
                    const accuracy = position.coords.accuracy;

                    const distance = calculateDistance(
                        userLat,
                        userLon,
                        CLASS_LAT,
                        CLASS_LON
                    );

                    // 🔥 Dynamic radius based on accuracy
                    const allowedRadius = Math.max(15, accuracy);

                    let status = "";

                    if (distance <= allowedRadius) {
                        status = "✅ VALID - Within acceptable range";
                    } else {
                        status = "❌ INVALID - Outside acceptable range";
                    }

                    output.innerHTML = `
                        <p><strong>Your Location:</strong></p>
                        <p>Lat: ${userLat.toFixed(6)}, Lon: ${userLon.toFixed(6)}</p>
                        <p><strong>Distance:</strong> ${distance.toFixed(2)} meters</p>
                        <p><strong>Accuracy:</strong> ${accuracy.toFixed(2)} meters</p>
                        <p><strong>Allowed Radius:</strong> ${allowedRadius.toFixed(2)} meters</p>
                        <p><strong>Status:</strong> ${status}</p>
                    `;
                },
                () => {
                    output.innerHTML = "Location access denied.";
                }
            );
        }
    </script>

</body>
</html>
