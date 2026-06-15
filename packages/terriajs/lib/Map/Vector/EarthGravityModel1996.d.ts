declare class EarthGravityModel1996 {
  readonly minimumHeight: number;
  readonly maximumHeight: number;

  constructor(gridFileUrl: string);

  getHeight(longitude: number, latitude: number): Promise<number>;
}

export default EarthGravityModel1996;
