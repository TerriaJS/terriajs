import { FeedEntity, OccupancyStatus } from "./GtfsRealtimeProtoBufReaders";
import _get from "lodash-es/get";

export default function prettyPrintGtfsEntityField(
  field: string,
  entity: FeedEntity
) {
  switch (field) {
    // TODO: Get sone of this data (eg. route short name) from static GTFS csv files instead
    // This probably only works for NSW
    case "route_short_name": {
      const route: string = _get(entity, "vehicle.trip.route_id", "");
      if (route !== undefined && route.indexOf("_") + 1 > 0) {
        return route.substr(route.indexOf("_") + 1);
      } else {
        return "";
      }
    }
    case "occupancy_status#str": {
      const occupancy: OccupancyStatus | undefined = _get(
        entity,
        "vehicle.occupancy_status"
      );
      if (occupancy !== undefined && occupancy !== null) {
        switch (occupancy) {
          case OccupancyStatus.EMPTY:
            return "Empty";
          case OccupancyStatus.MANY_SEATS_AVAILABLE:
            return "Many seats available";
          case OccupancyStatus.FEW_SEATS_AVAILABLE:
            return "Few seats available";
          case OccupancyStatus.STANDING_ROOM_ONLY:
            return "Standing room only";
          case OccupancyStatus.CRUSHED_STANDING_ROOM_ONLY:
            return "Crushed standing room only";
          case OccupancyStatus.FULL:
            return "Full";
          case OccupancyStatus.NOT_ACCEPTING_PASSENGERS:
            return "Not accepting passengers";
        }
      }
      break;
    }
    case "speed#km": {
      return (_get(entity, "vehicle.position.speed", 0) * 3.6).toFixed(2);
    }
    case "speed": {
      return _get(entity, "vehicle.position.speed", 0).toFixed(2);
    }
    case "bearing": {
      return _get(entity, "vehicle.position.bearing", 0).toFixed(2);
    }
    default: {
      return undefined;
    }
  }
}
