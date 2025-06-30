// 1. 도착 시 배터리 잔량 계산 함수
export function estimateArrivalBattery(
  currentPercent,
  distanceKm,
  efficiencyKmPerKwh,
  batteryCapacityKwh
) {
  const usedEnergy = distanceKm / efficiencyKmPerKwh; // 사용된 kWh
  const usedPercent = (usedEnergy / batteryCapacityKwh) * 100; // 퍼센트 변환
  const arrivalPercent = currentPercent - usedPercent;

  return Math.max(arrivalPercent, 0); // 음수 방지
}

//2. 충전 시간 계산 함수
export function estimateChargingTime(
  batteryCapacityKwh,
  arrivalPercent,
  targetPercent,
  chargingSpeedKw
) {
  const chargeAmount =
    (batteryCapacityKwh * (targetPercent - arrivalPercent)) / 100;
  const timeInHours = chargeAmount / chargingSpeedKw;
  const timeInMinutes = timeInHours * 60;

  return Math.round(timeInMinutes); // 분 단위
}
