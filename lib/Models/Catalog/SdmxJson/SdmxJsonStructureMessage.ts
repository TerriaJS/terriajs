/*  This was generated from https://github.com/sdmx-twg/sdmx-json/blob/master/structure-message/tools/schemas/1.0/sdmx-json-structure-schema.json using `json-schema-to-typescript`.

It has also been refactored manually to provide better type names and reduce code duplication

These are the structures which are inlcluded:
  dataStructures, conceptSchemes, codelists, agencySchemes, dataProviderSchemes, dataConsumerSchemes, organisationUnitSchemes, dataflows, metadataflows, provisionAgreements, structureSets, categorisations, attachmentConstraints, contentConstraints
*/

export type ArrayOneOrMore<T> = {
  0: T;
} & Array<T>;

export type AgencyScheme = MaintainableType & {
  isPartial?: boolean;
  agencies?: Agencies;
  [k: string]: unknown;
};

export type AgencySchemes = ArrayOneOrMore<AgencyScheme>;

export type Agency = NameableTypeWithNCNameID & {
  contacts?: ContactType[];
  [k: string]: unknown;
};

export type Agencies = Agency[];

export type CategoryScheme = MaintainableType & {
  isPartial?: boolean;
  categories?: Categories;
  [k: string]: unknown;
};

export type Category = NameableTypeWithNCNameID & {
  categories?: Categories;
  [k: string]: unknown;
};

export type Categories = Category[];

export type CategorySchemes = ArrayOneOrMore<CategoryScheme>;

export type Categorisation = MaintainableType & {
  /**
   * Source is a urn reference to an object to be categorized.
   */
  source?: string;
  /**
   * Target is a urn reference to the category that the referenced object is to be mapped to.
   */
  target?: string;
  [k: string]: unknown;
};

export type Categorisations = ArrayOneOrMore<Categorisation>;
/**
 * Links field is an array of link objects. If appropriate, a collection of links to additional external resources for the header.
 */

export type Dataflow = MaintainableType & {
  /**
   * Urn reference to the data structure definition which defines the structure of all data for this flow.
   */
  structure?: string;
  [k: string]: unknown;
};

export type Dataflows = ArrayOneOrMore<Dataflow>;

export type Attribute = IdentifiableTypeWithNCNameID & {
  assignmentStatus?: UsageStatusType;
  /**
   * AttributeRelationship describes how the value of this attribute varies with the values of other components. These relationships will be used to determine the attachment level of the attribute in the various data formats.
   */
  attributeRelationship?: {
    attachmentGroups?: string[];
    dimensions?: string[];
    /**
     * Identifier of a local GroupKey Descriptor. This is used as a convenience to referencing all of the dimension defined by the referenced group. The attribute will also be attached to this group.
     */
    group?: string;
    /**
     * This means that value of the attribute will not vary with any of the other data structure components. This will always be treated as a data set level attribute.
     */
    none?: {
      [k: string]: unknown;
    };
    /**
     * Identifier of the local primary measure, where the reference to the data structure definition which defines the primary measure is provided in another context (for example the data structure definition in which the reference occurs). This is used to specify that the value of the attribute is dependent upon the observed value. An attribute with this relationship will always be treated as an observation level attribute.
     */
    primaryMeasure?: string;
    [k: string]: unknown;
  };
  /**
   * Urn reference to a concept where the identification of the concept scheme which defines it is contained in another context.
   */
  conceptIdentity?: string;
  conceptRoles?: string[];
  localRepresentation?: SimpleDataStructureRepresentationType;
  [k: string]: unknown;
};

export type Dimension = IdentifiableTypeWithNCNameID & {
  /**
   * The position attribute specifies the position of the dimension in the data structure definition, starting at 0. It is optional as the position of the dimension in the key descriptor (DimensionList element) always takes precedence over the value supplied here. This is strictly for informational purposes only.
   */
  position?: number;
  /**
   * The type attribute identifies whether then dimension is a measure dimension, the time dimension, or a regular dimension. Although these are all apparent by the element names, this attribute allows for each dimension to be processed independent of its element as well as maintaining the restriction of only one measure and time dimension while still allowing dimension to occur in any order.
   */
  type?: "Dimension" | "MeasureDimension" | "TimeDimension";
  /**
   * Urn reference to a concept where the identification of the concept scheme which defines it is contained in another context.
   */
  conceptIdentity?: string;
  /**
   * ConceptRoles references concepts which define roles which this dimension serves. If the concept from which the attribute takes its identity also defines a role the concept serves, then the isConceptRole indicator can be set to true on the concept identity rather than repeating the reference here.
   */
  conceptRoles?: string[];
  localRepresentation?: SimpleDataStructureRepresentationType;
  [k: string]: unknown;
};

export type DataStructure = MaintainableType & {
  /**
   * DataStructureComponents defines the grouping of the sets of metadata concepts that have a defined structural role in the data structure definition. Note that for any component or group defined in a data structure definition, its id must be unique. This applies to the identifiers explicitly defined by the components as well as those inherited from the concept identity of a component. For example, if two dimensions take their identity from concepts with same identity (regardless of whether the concepts exist in different schemes) one of the dimensions must be provided a different explicit identifier. Although there are XML schema constraints to help enforce this, these only apply to explicitly assigned identifiers. Identifiers inherited from a concept from which a component takes its identity cannot be validated against this constraint. Therefore, systems processing data structure definitions will have to perform this check outside of the XML validation. There are also three reserved identifiers in a data structure definition; OBS_VALUE, TIME_PERIOD, and REPORTING_PERIOD_START_DAY. These identifiers may not be used outside of their respective defintions (PrimaryMeasure, TimeDimension, and ReportingYearStartDay). This applies to both the explicit identifiers that can be assigned to the components or groups as well as an identifier inherited by a component from its concept identity. For example, if an ordinary dimension (i.e. not the time dimension) takes its concept identity from a concept with the identifier TIME_PERIOD, that dimension must provide a different explicit identifier.
   */
  dataStructureComponents?: {
    /**
     * AttributeList describes the attribute descriptor for the data structure definition. It is a collection of metadata concepts that define the attributes of the data structure definition.
     */
    attributeList?: IdentifiableType & {
      attributes?: Attribute[];
      reportingYearStartDays?: (IdentifiableTypeWithNCNameID & {
        assignmentStatus?: UsageStatusType;
        attributeRelationship?: AttributeRelationshipType;
        /**
         * Urn reference to a concept where the identification of the concept scheme which defines it is contained in another context.
         */
        conceptIdentity?: string;
        localRepresentation?: ReportingYearStartDayRepresentationType;
        [k: string]: unknown;
      })[];
      [k: string]: unknown;
    };
    /**
     * DimensionList describes the key descriptor for the data structure definition. It is an ordered set of metadata concepts that, combined, classify a statistical series, such as a time series, and whose values, when combined (the key) in an instance such as a data set, uniquely identify a specific series.
     */
    dimensionList: IdentifiableType & {
      dimensions?: Dimension[];
      measureDimensions?: Dimension[];
      timeDimensions?: Dimension[];
      [k: string]: unknown;
    };
    groups?: (IdentifiableType & {
      /**
       * Urn reference to an attachment constraint that defines the key sets and/or cube regions that attributes may be attached to. This is an alternative to referencing the dimensions, and allows attributes to be attached to data for given values of dimensions.
       */
      attachmentConstraint?: string;
      groupDimensions?: string[];
      [k: string]: unknown;
    })[];
    /**
     * MeasureList describes the measure descriptor for a data structure. It contains a single metadata concepts that define the primary measures of a data structure.
     */
    measureList: IdentifiableType & {
      /**
       * PrimaryMeasure defines the structure of the primary measure, which is the concept that is the value of the phenomenon to be measured in a data set. Although this may take its semantic from any concept, this is provided a fixed identifier (OBS_VALUE) so that it may be easily distinguished in data messages.
       */
      primaryMeasure?: IdentifiableTypeWithNCNameID & {
        /**
         * Urn reference to a concept where the identification of the concept scheme which defines it is contained in another context.
         */
        conceptIdentity?: string;
        localRepresentation?: SimpleDataStructureRepresentationType;
        [k: string]: unknown;
      };
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  [k: string]: unknown;
};

export type DataStructures = ArrayOneOrMore<DataStructure>;

export type Code = NameableType & {
  /**
   * Parent provides the ability to describe simple hierarchies within a single codelist, by referencing the id value of another code in the same codelist.
   */
  parent?: string;
  [k: string]: unknown;
};

export type Codes = Code[];

export type CodeList = MaintainableTypeWithNCNameID & {
  isPartial?: boolean;
  codes?: Codes;
  [k: string]: unknown;
};

export type CodeLists = ArrayOneOrMore<CodeList>;

export type ConceptScheme = MaintainableTypeWithNCNameID & {
  isPartial?: boolean;
  concepts?: (NameableTypeWithNCNameID & {
    coreRepresentation?: ConceptRepresentation;
    /**
     * Provides a urn reference (containing conceptSchemeID, conceptAgency, conceptID) to an ISO 11179 concept.
     */
    isoConceptReference?: string;
    /**
     * Urn reference to a local concept. Parent captures the semantic relationships between concepts which occur within a single concept scheme. This identifies the concept of which the current concept is a qualification (in the ISO 11179 sense) or subclass.
     */
    parent?: string;
    [k: string]: unknown;
  })[];
  [k: string]: unknown;
};

export type ConceptSchemes = ArrayOneOrMore<ConceptScheme>;

export type ContentConstraint = MaintainableType & {
  type?: ContentConstraintTypeCodeType;
  /**
   * ConstraintAttachment describes the collection of constrainable artefacts that the constraint is attached to.
   */
  constraintAttachment?: {
    /**
     * dataProvider is a urn reference to a the provider of the data/metadata set to which the constraint is attached. If this is used, then only the release calendar is relevant..
     */
    dataProvider?: string;
    /**
     * dataSet is a urn reference to a data set to which the constraint is attached.
     */
    dataSet?: {
      /**
       * DataProvider is a urn reference to a the provider of the data/metadata set.
       */
      dataProvider: string;
      /**
       * ID contains the identifier of the data/metadata set being referenced.
       */
      id: string;
      [k: string]: unknown;
    };
    dataStructures?: string[];
    dataflows?: string[];
    /**
     * metadataSet is a urn reference to a metadata set to which the constraint is attached.
     */
    metadataSet?: {
      /**
       * DataProvider is a urn reference to a the provider of the data/metadata set.
       */
      dataProvider: string;
      /**
       * ID contains the identifier of the data/metadata set being referenced.
       */
      id: string;
      [k: string]: unknown;
    };
    metadataStructures?: string[];
    metadataflows?: string[];
    provisionAgreements?: string[];
    queryableDataSources?: {
      isRESTDatasource: boolean;
      isWebServiceDatasource: boolean;
      /**
       * DataURL contains the URL of the data source.
       */
      dataURL: string;
      /**
       * WADLURL provides the location of a WADL instance on the internet which describes the REST protocol of the queryable data source.
       */
      wadlURL?: string;
      /**
       * WSDLURL provides the location of a WSDL instance on the internet which describes the queryable data source.
       */
      wsdlURL?: string;
      [k: string]: unknown;
    }[];
    /**
     * simpleDataSource describes a simple data source, which is a URL of a SDMX-ML data or metadata message.
     */
    simpleDataSource?: string;
    [k: string]: unknown;
  };
  cubeRegions?: {
    isIncluded?: boolean;
    attributes?: AttributeValueSetType[];
    keyValues?: CubeRegionKeyType[];
    [k: string]: unknown;
  }[];
  dataKeySets?: {
    isIncluded: boolean;
    keys: [
      {
        keyValues: [DataKeyValueType, ...DataKeyValueType[]];
        [k: string]: unknown;
      },
      ...{
        keyValues: [DataKeyValueType, ...DataKeyValueType[]];
        [k: string]: unknown;
      }[]
    ];
    [k: string]: unknown;
  }[];
  metadataKeySets?: {
    isIncluded: boolean;
    keys: [
      {
        metadataTarget: IdType;
        report: IdType;
        keyValues: [MetadataKeyValueType, ...MetadataKeyValueType[]];
        [k: string]: unknown;
      },
      ...{
        metadataTarget: IdType;
        report: IdType;
        keyValues: [MetadataKeyValueType, ...MetadataKeyValueType[]];
        [k: string]: unknown;
      }[]
    ];
    [k: string]: unknown;
  }[];
  metadataTargetRegions?: {
    include?: boolean;
    metadataTarget: IdType;
    report: IdType;
    attributes?: MetadataAttributeValueSetType[];
    keyValues?: MetadataTargetRegionKeyType[];
    [k: string]: unknown;
  }[];
  /**
   * ReferencePeriod is used to report start date and end date constraints.
   */
  referencePeriod?: {
    endTime: string;
    startTime: string;
    [k: string]: unknown;
  };
  /**
   * ReleaseCalendar defines dates on which the constrained data is to be made available.
   */
  releaseCalendar?: {
    /**
     * Offset is the interval between January first and the first release of data within the year.
     */
    offset: string;
    /**
     * Periodicity is the period between releases of the data set.
     */
    periodicity: string;
    /**
     * Tolerance is the period after which the release of data may be deemed late.
     */
    tolerance: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
};

export type ContentConstraints = ArrayOneOrMore<ContentConstraint>;

// Start autogenerated ---------------------------------------

export type Links = (
  | {
      [k: string]: unknown;
    }
  | {
      [k: string]: unknown;
    }
)[];
/**
 * MaintainableType is an abstract base type for all maintainable objects.
 */
export type MaintainableType = {
  version?: VersionType;
  agencyID?: NestedNCNameIDType;
  [k: string]: unknown;
} & NameableType & {
    isExternalReference?: boolean;
    isFinal?: boolean;
    validFrom?: string;
    validTo?: string;
    [k: string]: unknown;
  };
/**
 * VersionType is used to communicate version information. The format is restricted to allow for simple incrementing and sorting of version number. The version consists of an unlimited set of numeric components, separated by the '.' character. When processing version, each numeric component (the number preceding and following any '.' character) should be parsed as an integer. Thus, a version of 1.3 and 1.03 would be equivalent, as both the '3' component and the '03' component would parse to an integer value of 3.
 */
export type VersionType = string;
/**
 * NestedNCNameIDType restricts the NestedIDType, so that the id may be used to generate valid XML components. IDs created from this type conform to the W3C XML Schema NCNAME type, and therefore can be used as element or attribute names. Regex: [A-Za-z][A-Za-z0-9_\-]*(\.[A-Za-z][A-Za-z0-9_\-]*)*
 */
export type NestedNCNameIDType = string;
/**
 * NameableType is an abstract base type for all nameable objects.
 */
export type NameableType = IdentifiableType & {
  name?: LocalisedBestMatchText;
  names?: LocalisedText;
  description?: LocalisedBestMatchText;
  descriptions?: LocalisedText;
  [k: string]: unknown;
};
/**
 * IdentifiableType is an abstract base type for all identifiable objects.
 */
export type IdentifiableType = {
  id?: IdType;
  [k: string]: unknown;
} & AnnotableType;
/**
 * IDType provides a type which is used for restricting the characters in codes and IDs throughout all SDMX-ML messages. Valid characters include A-Z, a-z, @, 0-9, _, -, $. Regex: [A-Za-z0-9_@$-]+
 */
export type IdType = string;
/**
 * Annotations is a reusable element the provides for a collection of annotations. It has been made global so that restrictions of types that extend AnnotatableType my reference it.
 */
export type Annotations = [AnnotationType, ...AnnotationType[]];
/**
 * localisedBestMatchText is a reusable element, used for providing a human-readable best-language-match texts.
 */
export type LocalisedBestMatchText = string;
/**
 * IdentifiableType is an abstract base type for all identifiable objects.
 */
export type IdentifiableTypeWithNCNameID = {
  id?: NCNameIDType;
  [k: string]: unknown;
} & AnnotableType;
/**
 * NCNameIDType restricts the IDType, so that the id may be used to generate valid XML components. IDs created from this type conform to the W3C XML Schema NCNAME type, and therefore can be used as element or attribute names.
 */
export type NCNameIDType = string;
/**
 * UsageStatusType provides a list of enumerated types for indicating whether reporting a given attribute is mandatory or conditional.
 */
export type UsageStatusType = "Mandatory" | "Conditional";
/**
 * StandardTimePeriodType defines the set of standard time periods in SDMX. This includes the reporting time periods and the basic date type (i.e. the calendar time periods and the dateTime format).
 */
export type StandardTimePeriodType =
  | string
  | string
  | string
  | string
  | (
      | ReportingYearType
      | ReportingSemesterType
      | ReportingTrimesterType
      | ReportingQuarterType
      | ReportingMonthType
      | ReportingWeekType
      | ReportingDayType
    );
/**
 * ReportingYearType defines a time period of 1 year (P1Y) in relation to a reporting year which has a start day (day-month) specified in the specialized reporting year start day attribute. In the absence of a start day for the reporting year, a day of January 1 is assumed. In this case a reporting year will coincide with a calendar year. The format of a reporting year is YYYY-A1 (e.g. 2000-A1). Note that the period value of 1 is fixed.
 */
export type ReportingYearType = string;
/**
 * ReportingSemesterType defines a time period of 6 months (P6M) in relation to a reporting year which has a start day (day-month) specified in the specialized reporting year start day attribute. In the absence of a start day for the reporting year, a day of January 1 is assumed. The format of a reporting semester is YYYY-Ss (e.g. 2000-S1), where s is either 1 or 2.
 */
export type ReportingSemesterType = string;
/**
 * ReportingTrimesterType defines a time period of 4 months (P4M) in relation to a reporting year which has a start day (day-month) specified in the specialized reporting year start day attribute. In the absence of a start day for the reporting year, a day of January 1 is assumed. The format of a reporting trimester is YYYY-Tt (e.g. 2000-T1), where s is either 1, 2, or 3.
 */
export type ReportingTrimesterType = string;
/**
 * ReportingQuarterType defines a time period of 3 months (P3M) in relation to a reporting year which has a start day (day-month) specified in the specialized reporting year start day attribute. In the absence of a start day for the reporting year, a day of January 1 is assumed. The format of a reporting quarter is YYYY-Qq (e.g. 2000-Q1), where q is a value between 1 and 4.
 */
export type ReportingQuarterType = string;
/**
 * ReportingMonthType defines a time period of 1 month (P1M) in relation to a reporting year which has a start day (day-month) specified in the specialized reporting year start day attribute. In the absence of a start day for the reporting year, a day of January 1 is assumed. In this case a reporting month will coincide with a calendar month. The format of a reporting month is YYYY-Mmm (e.g. 2000-M01), where mm is a two digit month (i.e. 01-12).
 */
export type ReportingMonthType = string;
/**
 * ReportingWeekType defines a time period of 7 days (P7D) in relation to a reporting year which has a start day (day-month) specified in the specialized reporting year start day attribute. A standard reporting week is based on the ISO 8601 defintion of a week date, in relation to the reporting period start day. The first week is defined as the week with the first Thursday on or after the reporting year start day. An equivalent definition is the week starting with the Monday nearest in time to the reporting year start day. There are other equivalent defintions, all of which should be adjusted based on the reporting year start day. In the absence of a start day for the reporting year, a day of January 1 is assumed. The format of a reporting week is YYYY-Www (e.g. 2000-W01), where mm is a two digit week (i.e. 01-53).
 */
export type ReportingWeekType = string;
/**
 * ReportingDayType defines a time period of 1 day (P1D) in relation to a reporting year which has a start day (day-month) specified in the specialized reporting year start day attribute. In the absence of a start day for the reporting year, a day of January 1 is assumed. The format of a reporting day is YYYY-Dddd (e.g. 2000-D001), where ddd is a three digit day (i.e. 001-366).
 */
export type ReportingDayType = string;
/**
 * CodeDataType is a restriction of the basic data types that are applicable to codes. Although some of the higher level time period formats are perimitted, it should be noted that any value which contains time (which includes a time zone offset) is not allowable as a code identifier.
 */
export type CodeDataType =
  | "String"
  | "Alpha"
  | "AlphaNumeric"
  | "Numeric"
  | "BigInteger"
  | "Integer"
  | "Long"
  | "Short"
  | "Boolean"
  | "URI"
  | "Count"
  | "InclusiveValueRange"
  | "ExclusiveValueRange"
  | "Incremental"
  | "ObservationalTimePeriod"
  | "StandardTimePeriod"
  | "BasicTimePeriod"
  | "GregorianTimePeriod"
  | "GregorianYear"
  | "GregorianYearMonth"
  | "GregorianDay"
  | "ReportingTimePeriod"
  | "ReportingYear"
  | "ReportingSemester"
  | "ReportingTrimester"
  | "ReportingQuarter"
  | "ReportingMonth"
  | "ReportingWeek"
  | "ReportingDay"
  | "Month"
  | "MonthDay"
  | "Day"
  | "Duration";
export type Duration = string;
/**
 * SimpleDataType restricts BasicComponentDataType to specify the allowable data types for a data structure definition component. The XHTML representation is removed as a possible type.
 */
export type SimpleDataType =
  | "String"
  | "Alpha"
  | "AlphaNumeric"
  | "Numeric"
  | "BigInteger"
  | "Integer"
  | "Long"
  | "Short"
  | "Decimal"
  | "Float"
  | "Double"
  | "Boolean"
  | "URI"
  | "Count"
  | "InclusiveValueRange"
  | "ExclusiveValueRange"
  | "Incremental"
  | "ObservationalTimePeriod"
  | "StandardTimePeriod"
  | "BasicTimePeriod"
  | "GregorianTimePeriod"
  | "GregorianYear"
  | "GregorianYearMonth"
  | "GregorianDay"
  | "ReportingTimePeriod"
  | "ReportingYear"
  | "ReportingSemester"
  | "ReportingTrimester"
  | "ReportingQuarter"
  | "ReportingMonth"
  | "ReportingWeek"
  | "ReportingDay"
  | "DateTime"
  | "TimeRange"
  | "Month"
  | "MonthDay"
  | "Day"
  | "Time"
  | "Duration";
/**
 * TimeDataType restricts SimpleDataType to specify the allowable data types for representing a time value.
 */
export type TimeDataType =
  | "ObservationalTimePeriod"
  | "StandardTimePeriod"
  | "BasicTimePeriod"
  | "GregorianTimePeriod"
  | "GregorianYear"
  | "GregorianYearMonth"
  | "GregorianDay"
  | "ReportingTimePeriod"
  | "ReportingYear"
  | "ReportingSemester"
  | "ReportingTrimester"
  | "ReportingQuarter"
  | "ReportingMonth"
  | "ReportingWeek"
  | "ReportingDay"
  | "DateTime"
  | "TimeRange";
/**
 * MaintainableType is an abstract base type for all maintainable objects with NCNameID.
 */
export type MaintainableTypeWithNCNameID = {
  version?: VersionType;
  agencyID?: NestedNCNameIDType;
  [k: string]: unknown;
} & NameableTypeWithNCNameID & {
    isExternalReference?: boolean;
    isFinal?: boolean;
    validFrom?: string;
    validTo?: string;
    [k: string]: unknown;
  };
/**
 * NameableType is an abstract base type for all nameable objects with NCNameID.
 */
export type NameableTypeWithNCNameID = IdentifiableTypeWithNCNameID & {
  name?: LocalisedBestMatchText;
  names?: LocalisedText;
  description?: LocalisedBestMatchText;
  descriptions?: LocalisedText;
  [k: string]: unknown;
};
/**
 * BasicComponentDataType provides an enumerated list of the types of characters allowed in the textType attribute for all non-target object components.
 */
export type BasicComponentDataType =
  | "String"
  | "Alpha"
  | "AlphaNumeric"
  | "Numeric"
  | "BigInteger"
  | "Integer"
  | "Long"
  | "Short"
  | "Decimal"
  | "Float"
  | "Double"
  | "Boolean"
  | "URI"
  | "Count"
  | "InclusiveValueRange"
  | "ExclusiveValueRange"
  | "Incremental"
  | "ObservationalTimePeriod"
  | "StandardTimePeriod"
  | "BasicTimePeriod"
  | "GregorianTimePeriod"
  | "GregorianYear"
  | "GregorianYearMonth"
  | "GregorianDay"
  | "ReportingTimePeriod"
  | "ReportingYear"
  | "ReportingSemester"
  | "ReportingTrimester"
  | "ReportingQuarter"
  | "ReportingMonth"
  | "ReportingWeek"
  | "ReportingDay"
  | "DateTime"
  | "TimeRange"
  | "Month"
  | "MonthDay"
  | "Day"
  | "Time"
  | "Duration"
  | "XHTML";
/**
 * DataTypeType provides an enumerated list of the types of data formats allowed as the for the representation of an object.
 */
export type DataType =
  | "String"
  | "Alpha"
  | "AlphaNumeric"
  | "Numeric"
  | "BigInteger"
  | "Integer"
  | "Long"
  | "Short"
  | "Decimal"
  | "Float"
  | "Double"
  | "Boolean"
  | "URI"
  | "Count"
  | "InclusiveValueRange"
  | "ExclusiveValueRange"
  | "Incremental"
  | "ObservationalTimePeriod"
  | "StandardTimePeriod"
  | "BasicTimePeriod"
  | "GregorianTimePeriod"
  | "GregorianYear"
  | "GregorianYearMonth"
  | "GregorianDay"
  | "ReportingTimePeriod"
  | "ReportingYear"
  | "ReportingSemester"
  | "ReportingTrimester"
  | "ReportingQuarter"
  | "ReportingMonth"
  | "ReportingWeek"
  | "ReportingDay"
  | "DateTime"
  | "TimeRange"
  | "Month"
  | "MonthDay"
  | "Day"
  | "Time"
  | "Duration"
  | "XHTML"
  | "KeyValues"
  | "IdentifiableReference"
  | "DataSetReference"
  | "AttachmentConstraintReference";
/**
 * SingleNCNameIDType restricts the NestedNCNameIDType to allow only one level. Note that this is the same pattern as the NCNameIDType, but can be used when the base type to be restricted is a nested NCNameIDType (where as the NCNameIDType could only restrict the IDType).
 */
export type SingleNCNameIDType = string;
/**
 * SimpleKeyValueType derives from the SimpleValueType, but does not allow for the cascading of value in the hierarchy, as keys are meant to describe a distinct full or partial key.
 */
export type SimpleKeyValueType = string;
/**
 * ContentConstraintTypeCodeType defines a list of types for a content constraint. A content constraint can state which data is present or which content is allowed for the constraint attachment. If 'Allowed' then the constraint contains the allowed values for attachable object. If 'Actual' then the constraints contains the actual data present for the attachable object.
 */
export type ContentConstraintTypeCodeType = "Allowed" | "Actual";
/**
 * ObservationalTimePeriodType specifies a distinct time period or point in time in SDMX. The time period can either be a Gregorian calendar period, a standard reporting period, a distinct point in time, or a time range with a specific date and duration.
 */
export type ObservationalTimePeriodType =
  | BasicTimePeriodType
  | ReportingTimePeriodType
  | string
  | string;
/**
 * BasicTimePeriodType contains the basic dates and calendar periods. It is a combination of the Gregorian time periods and the date time type..
 */
export type BasicTimePeriodType =
  | {
      [k: string]: unknown;
    }
  | {
      [k: string]: unknown;
    }
  | {
      [k: string]: unknown;
    }
  | {
      [k: string]: unknown;
    };
/**
 * ReportingTimePeriodType defines standard reporting periods in SDMX, which are all in relation to the start day (day-month) of a reporting year which is specified in the specialized reporting year start day attribute. If the reporting year start day is not defined, a day of January 1 is assumed. The reporting year must be epxressed as the year at the beginning of the period. Therfore, if the reproting year runs from April to March, any given reporting year is expressed as the year for April. The general format of a report period can be described as  [year]-[period][time zone]?, where the type of period is designated with a single character followed by a number representing the period. Note that all periods allow for an optional time zone offset. See the details of each member type for the specifics of its format.
 */
export type ReportingTimePeriodType =
  | ReportingYearType
  | ReportingSemesterType
  | ReportingTrimesterType
  | ReportingQuarterType
  | ReportingMonthType
  | ReportingWeekType
  | ReportingDayType;

/**
 * SDMX-JSON Schema for structure messages
 */
export interface SdmxJsonStructureMessage {
  /**
   * A meta object that contains non-standard meta-information and basic technical information about the message, such as when it was prepared and who has sent it.
   */
  meta?: {
    /**
     * Contains the URL to the schema allowing to validate the message. This also allows identifying the version of SDMX-JSON format used in this message. Providing the link to the SDMX-JSON schema is recommended.
     */
    schema?: string;
    /**
     * Unique string assigned by the sender that identifies the message for further references.
     */
    id: string;
    /**
     * Test indicates whether the message is for test purposes or not. False for normal messages.
     */
    test?: boolean;
    /**
     * A timestamp indicating when the message was prepared. Values must follow the ISO 8601 syntax for combined dates and times, including time zone.
     */
    prepared: string;
    /**
     * Array of strings containing the identifyer of all languages used anywhere in the message for localized elements, and thus the languages of the intended audience, representaing in an array format the same information than the http Content-Language response header, e.g. "en, fr-fr". See IETF Language Tags: https://tools.ietf.org/html/rfc5646#section-2.1. The array's first element indicates the main language used in the message for localized elements. The usage of this property is recommended.
     */
    contentLanguages?: string[];
    /**
     * Name provides a name for the transmission. Multiple instances allow for parallel language values.
     */
    name?: string;
    /**
     * Name provides a name for the transmission. Multiple instances allow for parallel language values.
     */
    names?: {
      /**
       * This interface was referenced by `undefined`'s JSON-Schema definition
       * via the `patternProperty` "^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|[0-9]{3}))?((?:-(?:[0-9a-z]{5,8}|[0-9][0-9a-z]{3}))*)?((?:-[0-9a-wy-z](?:-[0-9a-z]{2,8})+)*)?(-x(?:-[0-9a-z]{1,8})+)?$|^(x(?:-[0-9a-z]{1,8})+)$".
       */
      [k: string]: string;
    };
    /**
     * Sender is information about the party that is transmitting the message.
     */
    sender: {
      /**
       * The id holds the identification of the party.
       */
      id: string;
      /**
       * Name is a human-readable name of the party.
       */
      name?: string;
      /**
       * Name is a human-readable name of the party.
       */
      names?: {
        /**
         * This interface was referenced by `undefined`'s JSON-Schema definition
         * via the `patternProperty` "^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|[0-9]{3}))?((?:-(?:[0-9a-z]{5,8}|[0-9][0-9a-z]{3}))*)?((?:-[0-9a-wy-z](?:-[0-9a-z]{2,8})+)*)?(-x(?:-[0-9a-z]{1,8})+)?$|^(x(?:-[0-9a-z]{1,8})+)$".
         */
        [k: string]: string;
      };
      /**
       * Contact provides contact information for the party in regard to the transmission of the message.
       */
      contacts?: ContactType[];
      [k: string]: unknown;
    };
    /**
     * Receiver is information about the part(y/ies) that is/are the intended recipient(s) of the message. This can be useful if the WS requires authentication.
     */
    receivers?: Party[];
    links?: Links;
    [k: string]: unknown;
  };
  /**
   * Data contains the message's “primary data”.
   */
  data?: {
    /**
     * dataStructures contains a collection of data structure definitions. The data structure definitions may be detailed in full, or referenced from an external structure document or registry service.
     */
    dataStructures?: DataStructures;
    /**
     * conceptSchemes contains one or more concept schemes, which can be explicitly detailed or referenced from an external structure document or registry service.
     */
    conceptSchemes?: ConceptSchemes;
    /**
     * codelists contains a collection of code list descriptions. The code lists may be detailed in full, or referenced from an external structure document or registry service.
     */
    codelists?: CodeLists;
    /**
     * agencySchemes contains a collection of agency scheme descriptions.
     */
    agencySchemes?: AgencySchemes;
    /**
     * dataProviderSchemes contains a collection of data provider schemes descriptions.
     */
    dataProviderSchemes?: [
      MaintainableType & {
        isPartial?: boolean;
        dataProviders?: (NameableType & {
          contacts?: ContactType[];
          [k: string]: unknown;
        })[];
        [k: string]: unknown;
      },
      ...(MaintainableType & {
        isPartial?: boolean;
        dataProviders?: (NameableType & {
          contacts?: ContactType[];
          [k: string]: unknown;
        })[];
        [k: string]: unknown;
      })[]
    ];
    /**
     * dataConsumerSchemes contains a collection of data consumer schemes descriptions.
     */
    dataConsumerSchemes?: [
      MaintainableType & {
        isPartial?: boolean;
        dataConsumers?: (NameableType & {
          contacts?: ContactType[];
          [k: string]: unknown;
        })[];
        [k: string]: unknown;
      },
      ...(MaintainableType & {
        isPartial?: boolean;
        dataConsumers?: (NameableType & {
          contacts?: ContactType[];
          [k: string]: unknown;
        })[];
        [k: string]: unknown;
      })[]
    ];
    /**
     * organisationUnitSchemes contains a collection of organisation unit schemes descriptions.
     */
    organisationUnitSchemes?: [
      MaintainableType & {
        isPartial?: boolean;
        organisationUnits?: (NameableType & {
          contacts?: ContactType[];
          /**
           * Urn reference to an organisation unit, where the reference to the organisation unit scheme which defines it is provided in another context.
           */
          parent?: string;
          [k: string]: unknown;
        })[];
        [k: string]: unknown;
      },
      ...(MaintainableType & {
        isPartial?: boolean;
        organisationUnits?: (NameableType & {
          contacts?: ContactType[];
          /**
           * Urn reference to an organisation unit, where the reference to the organisation unit scheme which defines it is provided in another context.
           */
          parent?: string;
          [k: string]: unknown;
        })[];
        [k: string]: unknown;
      })[]
    ];
    /**
     * dataflows contains a collection of data flow descriptions. The data flows may be detailed in full, or referenced from an external structure document or registry service.
     */
    dataflows?: Dataflows;
    /**
     * metadataflows contains a collection of metadata flow descriptions. The metadata flows may be detailed in full, or referenced from an external structure document or registry service.
     */
    metadataflows?: [
      MaintainableType & {
        /**
         * Structure provides a urn reference to the metadata structure definition describing the structure of all reference metadata for this flow.
         */
        structure?: string;
        [k: string]: unknown;
      },
      ...(MaintainableType & {
        /**
         * Structure provides a urn reference to the metadata structure definition describing the structure of all reference metadata for this flow.
         */
        structure?: string;
        [k: string]: unknown;
      })[]
    ];
    /**
     * provisionAgreements contains a collection of provision agreements. The provision agreements may be detailed in full, or referenced from an external structure document or registry service.
     */
    provisionAgreements?: [
      MaintainableType & {
        /**
         * DataProvider is a urn reference to a pre-existing data (or metadata) provider in the registry.
         */
        dataProvider: string;
        /**
         * DataflowReference provides a urn reference to a pre-existing structure usage (i.e. a dataflow or metadataflow) in the registry.
         */
        structureUsage: string;
        [k: string]: unknown;
      },
      ...(MaintainableType & {
        /**
         * DataProvider is a urn reference to a pre-existing data (or metadata) provider in the registry.
         */
        dataProvider: string;
        /**
         * DataflowReference provides a urn reference to a pre-existing structure usage (i.e. a dataflow or metadataflow) in the registry.
         */
        structureUsage: string;
        [k: string]: unknown;
      })[]
    ];
    /**
     * structureSets contains a collection of structure set descriptions. The structure sets may be detailed in full, or referenced from an external structure document or registry service.
     */
    structureSets?: [
      MaintainableType & {
        categorySchemeMaps?: (NameableType & {
          categoryMaps: [
            {
              annotations?: Annotations;
              /**
               * Urn reference to a category where the identification of the category scheme which defines it is contained in another context.
               */
              source: string;
              /**
               * Urn reference to a category where the identification of the category scheme which defines it is contained in another context.
               */
              target: string;
              [k: string]: unknown;
            },
            ...{
              annotations?: Annotations;
              /**
               * Urn reference to a category where the identification of the category scheme which defines it is contained in another context.
               */
              source: string;
              /**
               * Urn reference to a category where the identification of the category scheme which defines it is contained in another context.
               */
              target: string;
              [k: string]: unknown;
            }[]
          ];
          /**
           * Urn reference to a category scheme object.
           */
          source: string;
          /**
           * Urn reference to a category scheme object.
           */
          target: string;
          [k: string]: unknown;
        })[];
        codelistMaps?: (NameableType & {
          codeMaps: [
            {
              annotations?: Annotations;
              /**
               * Urn reference to a code where the identification of the codelist which defines it is contained in another context.
               */
              source: string;
              /**
               * Urn reference to a code where the identification of the codelist which defines it is contained in another context.
               */
              target: string;
              [k: string]: unknown;
            },
            ...{
              annotations?: Annotations;
              /**
               * Urn reference to a code where the identification of the codelist which defines it is contained in another context.
               */
              source: string;
              /**
               * Urn reference to a code where the identification of the codelist which defines it is contained in another context.
               */
              target: string;
              [k: string]: unknown;
            }[]
          ];
          /**
           * Source provides a urn reference to a codelist.
           */
          source: string;
          /**
           * Target provides a urn reference to a codelist.
           */
          target: string;
          [k: string]: unknown;
        })[];
        conceptSchemeMaps?: (NameableType & {
          conceptMaps: [
            {
              annotations?: Annotations;
              /**
               * Urn reference to a local concept.
               */
              source: string;
              /**
               * Urn reference to a local concept.
               */
              target: string;
              [k: string]: unknown;
            },
            ...{
              annotations?: Annotations;
              /**
               * Urn reference to a local concept.
               */
              source: string;
              /**
               * Urn reference to a local concept.
               */
              target: string;
              [k: string]: unknown;
            }[]
          ];
          /**
           * Urn reference to a concept scheme object.
           */
          source: string;
          /**
           * Urn reference to a concept scheme object.
           */
          target: string;
          [k: string]: unknown;
        })[];
        hybridCodelistMaps?: (NameableType & {
          hybridCodeMaps: [
            {
              annotations?: Annotations;
              /**
               * Source provides a local reference to the code which is to be mapped. If this code is from a hierarchical codelist, a reference to the hierarchy in which it is defined must also be provided.
               */
              source: string;
              /**
               * Target provides a local reference to the code to which the source code is mapped. If this code is from a hierarchical codelist, a reference to the hierarchy in which it is defined must also be provided.
               */
              target: string;
              [k: string]: unknown;
            },
            ...{
              annotations?: Annotations;
              /**
               * Source provides a local reference to the code which is to be mapped. If this code is from a hierarchical codelist, a reference to the hierarchy in which it is defined must also be provided.
               */
              source: string;
              /**
               * Target provides a local reference to the code to which the source code is mapped. If this code is from a hierarchical codelist, a reference to the hierarchy in which it is defined must also be provided.
               */
              target: string;
              [k: string]: unknown;
            }[]
          ];
          /**
           * Source provides a urn reference to either a codelist or a hierarchical codelist, from which the codes are to be mapped.
           */
          source: string;
          /**
           * Target provides a urn reference to either a codelist or a hierarchical codelist, to which the source codes are to be mapped.
           */
          target: string;
          [k: string]: unknown;
        })[];
        organisationSchemeMaps?: (NameableType & {
          organisationMaps: [
            {
              annotations?: Annotations;
              /**
               * Urn reference to an organisation, regardless of type, where the identification of the organisation scheme which defines it is contained in another context.
               */
              source: string;
              /**
               * Urn reference to an organisation, regardless of type, where the identification of the organisation scheme which defines it is contained in another context.
               */
              target: string;
              [k: string]: unknown;
            },
            ...{
              annotations?: Annotations;
              /**
               * Urn reference to an organisation, regardless of type, where the identification of the organisation scheme which defines it is contained in another context.
               */
              source: string;
              /**
               * Urn reference to an organisation, regardless of type, where the identification of the organisation scheme which defines it is contained in another context.
               */
              target: string;
              [k: string]: unknown;
            }[]
          ];
          /**
           * Urn reference to an organisation scheme regardless of the specific type.
           */
          source: string;
          /**
           * Urn reference to an organisation scheme regardless of the specific type.
           */
          target: string;
          [k: string]: unknown;
        })[];
        relatedStructures?: string[];
        reportingTaxonomyMaps?: (NameableType & {
          reportingCategoryMaps: [
            {
              annotations?: Annotations;
              /**
               * Urn reference to a reporting category.
               */
              source: string;
              /**
               * Urn reference to a reporting category.
               */
              target: string;
              [k: string]: unknown;
            },
            ...{
              annotations?: Annotations;
              /**
               * Urn reference to a reporting category.
               */
              source: string;
              /**
               * Urn reference to a reporting category.
               */
              target: string;
              [k: string]: unknown;
            }[]
          ];
          /**
           * Urn reference to a reporting taxonomy object.
           */
          source: string;
          /**
           * Urn reference to a reporting taxonomy object.
           */
          target: string;
          [k: string]: unknown;
        })[];
        structureMaps?: (NameableType & {
          isExtension?: boolean;
          componentMaps: [
            {
              annotations?: Annotations;
              /**
               * RepresentationMapping describes the mapping rules to map the value of the source component to the target component. Note that is a representation mapping is not supplied, then the value of the source component is mapped directly to the value of the target component without any manipulation.
               */
              representationMapping?: {
                /**
                 * CodelistMap references (through a urn) a codelist map defined in the same structure set which maps the enumeration of the representation of the source component to the enumeration of the representation of the target component.
                 */
                codelistMap?: string;
                /**
                 * ToTextFormat describes the un-coded representation of the target to which the value of the referenced component should be transformed.
                 */
                toTextFormat?: {
                  decimals?: number;
                  endTime?: StandardTimePeriodType;
                  endValue?: number;
                  interval?: number;
                  isMultiLingual?: boolean;
                  isSequence?: boolean;
                  maxLength?: number;
                  maxValue?: number;
                  minLength?: number;
                  minValue?: number;
                  pattern?: string;
                  startTime?: StandardTimePeriodType;
                  startValue?: number;
                  textType?: DataType;
                  timeInterval?: Duration;
                  [k: string]: unknown;
                };
                /**
                 * ToValueType notes whether the value, name, or description of the source value should be used in the target value.
                 */
                toValueType?: "Value" | "Name" | "Description";
                /**
                 * ValueMap provides for a simple mapping of a source value to a target value without having to define a codelist map. This is available to allow mappings in situations such as the source or target is not being formally coded, or the source and/or target being a measure dimension in which case its representation is not mappable from a codelist map.
                 */
                valueMap?: {
                  valueMappings: [
                    {
                      source: string;
                      target: string;
                      [k: string]: unknown;
                    },
                    ...{
                      source: string;
                      target: string;
                      [k: string]: unknown;
                    }[]
                  ];
                  [k: string]: unknown;
                };
                [k: string]: unknown;
              };
              /**
               * Urn reference to any type of component in a specific component list where the reference to the structure which defines it are provided in another context.
               */
              source: string;
              /**
               * Urn reference to any type of component in a specific component list where the reference to the structure which defines it are provided in another context.
               */
              target: string;
              [k: string]: unknown;
            },
            ...{
              annotations?: Annotations;
              /**
               * RepresentationMapping describes the mapping rules to map the value of the source component to the target component. Note that is a representation mapping is not supplied, then the value of the source component is mapped directly to the value of the target component without any manipulation.
               */
              representationMapping?: {
                /**
                 * CodelistMap references (through a urn) a codelist map defined in the same structure set which maps the enumeration of the representation of the source component to the enumeration of the representation of the target component.
                 */
                codelistMap?: string;
                /**
                 * ToTextFormat describes the un-coded representation of the target to which the value of the referenced component should be transformed.
                 */
                toTextFormat?: {
                  decimals?: number;
                  endTime?: StandardTimePeriodType;
                  endValue?: number;
                  interval?: number;
                  isMultiLingual?: boolean;
                  isSequence?: boolean;
                  maxLength?: number;
                  maxValue?: number;
                  minLength?: number;
                  minValue?: number;
                  pattern?: string;
                  startTime?: StandardTimePeriodType;
                  startValue?: number;
                  textType?: DataType;
                  timeInterval?: Duration;
                  [k: string]: unknown;
                };
                /**
                 * ToValueType notes whether the value, name, or description of the source value should be used in the target value.
                 */
                toValueType?: "Value" | "Name" | "Description";
                /**
                 * ValueMap provides for a simple mapping of a source value to a target value without having to define a codelist map. This is available to allow mappings in situations such as the source or target is not being formally coded, or the source and/or target being a measure dimension in which case its representation is not mappable from a codelist map.
                 */
                valueMap?: {
                  valueMappings: [
                    {
                      source: string;
                      target: string;
                      [k: string]: unknown;
                    },
                    ...{
                      source: string;
                      target: string;
                      [k: string]: unknown;
                    }[]
                  ];
                  [k: string]: unknown;
                };
                [k: string]: unknown;
              };
              /**
               * Urn reference to any type of component in a specific component list where the reference to the structure which defines it are provided in another context.
               */
              source: string;
              /**
               * Urn reference to any type of component in a specific component list where the reference to the structure which defines it are provided in another context.
               */
              target: string;
              [k: string]: unknown;
            }[]
          ];
          /**
           * Source provides a reference to a structure (data or metadata) or a structure usage (dataflow or metadataflow) from which components defined by the actual structure are to mapped.
           */
          source: string;
          /**
           * Target provides a reference to a structure (data or metadata) or a structure usage (dataflow or metadataflow) to which components from the source are to mapped.
           */
          target: string;
          [k: string]: unknown;
        })[];
        [k: string]: unknown;
      },
      ...(MaintainableType & {
        categorySchemeMaps?: (NameableType & {
          categoryMaps: [
            {
              annotations?: Annotations;
              /**
               * Urn reference to a category where the identification of the category scheme which defines it is contained in another context.
               */
              source: string;
              /**
               * Urn reference to a category where the identification of the category scheme which defines it is contained in another context.
               */
              target: string;
              [k: string]: unknown;
            },
            ...{
              annotations?: Annotations;
              /**
               * Urn reference to a category where the identification of the category scheme which defines it is contained in another context.
               */
              source: string;
              /**
               * Urn reference to a category where the identification of the category scheme which defines it is contained in another context.
               */
              target: string;
              [k: string]: unknown;
            }[]
          ];
          /**
           * Urn reference to a category scheme object.
           */
          source: string;
          /**
           * Urn reference to a category scheme object.
           */
          target: string;
          [k: string]: unknown;
        })[];
        codelistMaps?: (NameableType & {
          codeMaps: [
            {
              annotations?: Annotations;
              /**
               * Urn reference to a code where the identification of the codelist which defines it is contained in another context.
               */
              source: string;
              /**
               * Urn reference to a code where the identification of the codelist which defines it is contained in another context.
               */
              target: string;
              [k: string]: unknown;
            },
            ...{
              annotations?: Annotations;
              /**
               * Urn reference to a code where the identification of the codelist which defines it is contained in another context.
               */
              source: string;
              /**
               * Urn reference to a code where the identification of the codelist which defines it is contained in another context.
               */
              target: string;
              [k: string]: unknown;
            }[]
          ];
          /**
           * Source provides a urn reference to a codelist.
           */
          source: string;
          /**
           * Target provides a urn reference to a codelist.
           */
          target: string;
          [k: string]: unknown;
        })[];
        conceptSchemeMaps?: (NameableType & {
          conceptMaps: [
            {
              annotations?: Annotations;
              /**
               * Urn reference to a local concept.
               */
              source: string;
              /**
               * Urn reference to a local concept.
               */
              target: string;
              [k: string]: unknown;
            },
            ...{
              annotations?: Annotations;
              /**
               * Urn reference to a local concept.
               */
              source: string;
              /**
               * Urn reference to a local concept.
               */
              target: string;
              [k: string]: unknown;
            }[]
          ];
          /**
           * Urn reference to a concept scheme object.
           */
          source: string;
          /**
           * Urn reference to a concept scheme object.
           */
          target: string;
          [k: string]: unknown;
        })[];
        hybridCodelistMaps?: (NameableType & {
          hybridCodeMaps: [
            {
              annotations?: Annotations;
              /**
               * Source provides a local reference to the code which is to be mapped. If this code is from a hierarchical codelist, a reference to the hierarchy in which it is defined must also be provided.
               */
              source: string;
              /**
               * Target provides a local reference to the code to which the source code is mapped. If this code is from a hierarchical codelist, a reference to the hierarchy in which it is defined must also be provided.
               */
              target: string;
              [k: string]: unknown;
            },
            ...{
              annotations?: Annotations;
              /**
               * Source provides a local reference to the code which is to be mapped. If this code is from a hierarchical codelist, a reference to the hierarchy in which it is defined must also be provided.
               */
              source: string;
              /**
               * Target provides a local reference to the code to which the source code is mapped. If this code is from a hierarchical codelist, a reference to the hierarchy in which it is defined must also be provided.
               */
              target: string;
              [k: string]: unknown;
            }[]
          ];
          /**
           * Source provides a urn reference to either a codelist or a hierarchical codelist, from which the codes are to be mapped.
           */
          source: string;
          /**
           * Target provides a urn reference to either a codelist or a hierarchical codelist, to which the source codes are to be mapped.
           */
          target: string;
          [k: string]: unknown;
        })[];
        organisationSchemeMaps?: (NameableType & {
          organisationMaps: [
            {
              annotations?: Annotations;
              /**
               * Urn reference to an organisation, regardless of type, where the identification of the organisation scheme which defines it is contained in another context.
               */
              source: string;
              /**
               * Urn reference to an organisation, regardless of type, where the identification of the organisation scheme which defines it is contained in another context.
               */
              target: string;
              [k: string]: unknown;
            },
            ...{
              annotations?: Annotations;
              /**
               * Urn reference to an organisation, regardless of type, where the identification of the organisation scheme which defines it is contained in another context.
               */
              source: string;
              /**
               * Urn reference to an organisation, regardless of type, where the identification of the organisation scheme which defines it is contained in another context.
               */
              target: string;
              [k: string]: unknown;
            }[]
          ];
          /**
           * Urn reference to an organisation scheme regardless of the specific type.
           */
          source: string;
          /**
           * Urn reference to an organisation scheme regardless of the specific type.
           */
          target: string;
          [k: string]: unknown;
        })[];
        relatedStructures?: string[];
        reportingTaxonomyMaps?: (NameableType & {
          reportingCategoryMaps: [
            {
              annotations?: Annotations;
              /**
               * Urn reference to a reporting category.
               */
              source: string;
              /**
               * Urn reference to a reporting category.
               */
              target: string;
              [k: string]: unknown;
            },
            ...{
              annotations?: Annotations;
              /**
               * Urn reference to a reporting category.
               */
              source: string;
              /**
               * Urn reference to a reporting category.
               */
              target: string;
              [k: string]: unknown;
            }[]
          ];
          /**
           * Urn reference to a reporting taxonomy object.
           */
          source: string;
          /**
           * Urn reference to a reporting taxonomy object.
           */
          target: string;
          [k: string]: unknown;
        })[];
        structureMaps?: (NameableType & {
          isExtension?: boolean;
          componentMaps: [
            {
              annotations?: Annotations;
              /**
               * RepresentationMapping describes the mapping rules to map the value of the source component to the target component. Note that is a representation mapping is not supplied, then the value of the source component is mapped directly to the value of the target component without any manipulation.
               */
              representationMapping?: {
                /**
                 * CodelistMap references (through a urn) a codelist map defined in the same structure set which maps the enumeration of the representation of the source component to the enumeration of the representation of the target component.
                 */
                codelistMap?: string;
                /**
                 * ToTextFormat describes the un-coded representation of the target to which the value of the referenced component should be transformed.
                 */
                toTextFormat?: {
                  decimals?: number;
                  endTime?: StandardTimePeriodType;
                  endValue?: number;
                  interval?: number;
                  isMultiLingual?: boolean;
                  isSequence?: boolean;
                  maxLength?: number;
                  maxValue?: number;
                  minLength?: number;
                  minValue?: number;
                  pattern?: string;
                  startTime?: StandardTimePeriodType;
                  startValue?: number;
                  textType?: DataType;
                  timeInterval?: Duration;
                  [k: string]: unknown;
                };
                /**
                 * ToValueType notes whether the value, name, or description of the source value should be used in the target value.
                 */
                toValueType?: "Value" | "Name" | "Description";
                /**
                 * ValueMap provides for a simple mapping of a source value to a target value without having to define a codelist map. This is available to allow mappings in situations such as the source or target is not being formally coded, or the source and/or target being a measure dimension in which case its representation is not mappable from a codelist map.
                 */
                valueMap?: {
                  valueMappings: [
                    {
                      source: string;
                      target: string;
                      [k: string]: unknown;
                    },
                    ...{
                      source: string;
                      target: string;
                      [k: string]: unknown;
                    }[]
                  ];
                  [k: string]: unknown;
                };
                [k: string]: unknown;
              };
              /**
               * Urn reference to any type of component in a specific component list where the reference to the structure which defines it are provided in another context.
               */
              source: string;
              /**
               * Urn reference to any type of component in a specific component list where the reference to the structure which defines it are provided in another context.
               */
              target: string;
              [k: string]: unknown;
            },
            ...{
              annotations?: Annotations;
              /**
               * RepresentationMapping describes the mapping rules to map the value of the source component to the target component. Note that is a representation mapping is not supplied, then the value of the source component is mapped directly to the value of the target component without any manipulation.
               */
              representationMapping?: {
                /**
                 * CodelistMap references (through a urn) a codelist map defined in the same structure set which maps the enumeration of the representation of the source component to the enumeration of the representation of the target component.
                 */
                codelistMap?: string;
                /**
                 * ToTextFormat describes the un-coded representation of the target to which the value of the referenced component should be transformed.
                 */
                toTextFormat?: {
                  decimals?: number;
                  endTime?: StandardTimePeriodType;
                  endValue?: number;
                  interval?: number;
                  isMultiLingual?: boolean;
                  isSequence?: boolean;
                  maxLength?: number;
                  maxValue?: number;
                  minLength?: number;
                  minValue?: number;
                  pattern?: string;
                  startTime?: StandardTimePeriodType;
                  startValue?: number;
                  textType?: DataType;
                  timeInterval?: Duration;
                  [k: string]: unknown;
                };
                /**
                 * ToValueType notes whether the value, name, or description of the source value should be used in the target value.
                 */
                toValueType?: "Value" | "Name" | "Description";
                /**
                 * ValueMap provides for a simple mapping of a source value to a target value without having to define a codelist map. This is available to allow mappings in situations such as the source or target is not being formally coded, or the source and/or target being a measure dimension in which case its representation is not mappable from a codelist map.
                 */
                valueMap?: {
                  valueMappings: [
                    {
                      source: string;
                      target: string;
                      [k: string]: unknown;
                    },
                    ...{
                      source: string;
                      target: string;
                      [k: string]: unknown;
                    }[]
                  ];
                  [k: string]: unknown;
                };
                [k: string]: unknown;
              };
              /**
               * Urn reference to any type of component in a specific component list where the reference to the structure which defines it are provided in another context.
               */
              source: string;
              /**
               * Urn reference to any type of component in a specific component list where the reference to the structure which defines it are provided in another context.
               */
              target: string;
              [k: string]: unknown;
            }[]
          ];
          /**
           * Source provides a reference to a structure (data or metadata) or a structure usage (dataflow or metadataflow) from which components defined by the actual structure are to mapped.
           */
          source: string;
          /**
           * Target provides a reference to a structure (data or metadata) or a structure usage (dataflow or metadataflow) to which components from the source are to mapped.
           */
          target: string;
          [k: string]: unknown;
        })[];
        [k: string]: unknown;
      })[]
    ];
    /**
     * categorySchemes contains a collection of category scheme descriptions. The category schemes may be detailed in full, or referenced from an external structure document or registry service.
     */
    categorySchemes?: CategorySchemes;
    /**
     * categorisations contains a collection of structural object categorisations. This container may contain categorisations for many types of objects. The categorisations may be detailed in full, or referenced from an external structure document or registry service.
     */
    categorisations?: Categorisations;
    /**
     * attachmentConstraints contains one or more attachment constraint, which can be explicitly detailed or referenced from an external structure document or registry service.
     */
    attachmentConstraints?: [
      MaintainableType & {
        constraintAttachment?: AttachmentConstraintAttachmentType;
        dataKeySets?: DataKeySetType[];
        metadataKeySets?: MetadataKeySetType[];
        [k: string]: unknown;
      },
      ...(MaintainableType & {
        constraintAttachment?: AttachmentConstraintAttachmentType;
        dataKeySets?: DataKeySetType[];
        metadataKeySets?: MetadataKeySetType[];
        [k: string]: unknown;
      })[]
    ];
    /**
     * contentConstraints contains one or more content constraint, which can be explicitly detailed or referenced from an external structure document or registry service.
     */
    contentConstraints?: ContentConstraints;
    [k: string]: unknown;
  };
  /**
   * Errors field is an array of error objects. When appropriate provides a list of error messages in addition to RESTful web services HTTP error status codes.
   */
  errors?: {
    /**
     * Provides a code number for the error message. Code numbers are defined in the SDMX 2.1 Web Services Guidelines.
     */
    code: number;
    /**
     * Title contains the title of the message, in best-match language value. A short, human-readable localised summary of the problem that SHOULD NOT change from occurrence to occurrence of the problem, except for purposes of localization.
     */
    title?: string;
    /**
     * Title contains the title of the message, in parallel language values. A list of short, human-readable localised summary of the problem that SHOULD NOT change from occurrence to occurrence of the problem, except for purposes of localization.
     */
    titles?: {
      /**
       * This interface was referenced by `undefined`'s JSON-Schema definition
       * via the `patternProperty` "^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|[0-9]{3}))?((?:-(?:[0-9a-z]{5,8}|[0-9][0-9a-z]{3}))*)?((?:-[0-9a-wy-z](?:-[0-9a-z]{2,8})+)*)?(-x(?:-[0-9a-z]{1,8})+)?$|^(x(?:-[0-9a-z]{1,8})+)$".
       */
      [k: string]: string;
    };
    /**
     * Detail contains the detailed text of the message, in best-match language value. A human-readable localised explanation specific to this occurrence of the problem. Like title, this field’s value can be localized. It is fully customizable by the service providers and should provide enough detail to ease understanding the reasons of the error.
     */
    detail?: string;
    /**
     * Detail contains the detailed text of the message, in parallel language values. A list of human-readable localised explanations specific to this occurrence of the problem. Like title, this field’s value can be localized. It is fully customizable by the service providers and should provide enough detail to ease understanding the reasons of the error.
     */
    details?: {
      /**
       * This interface was referenced by `undefined`'s JSON-Schema definition
       * via the `patternProperty` "^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|[0-9]{3}))?((?:-(?:[0-9a-z]{5,8}|[0-9][0-9a-z]{3}))*)?((?:-[0-9a-wy-z](?:-[0-9a-z]{2,8})+)*)?(-x(?:-[0-9a-z]{1,8})+)?$|^(x(?:-[0-9a-z]{1,8})+)$".
       */
      [k: string]: string;
    };
    /**
     * Links field is an array of link objects. If appropriate, a collection of links to additional external resources for the error.
     */
    links?: (
      | {
          [k: string]: unknown;
        }
      | {
          [k: string]: unknown;
        }
    )[];
    [k: string]: unknown;
  }[];
  [k: string]: unknown;
}
/**
 * ContactType describes the structure of a contact's details.
 */
export interface ContactType {
  /**
   * Name contains a humain-readable name for the contact.
   */
  name?: string;
  /**
   * Name contains a humain-readable name for the contact.
   */
  names?: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|[0-9]{3}))?((?:-(?:[0-9a-z]{5,8}|[0-9][0-9a-z]{3}))*)?((?:-[0-9a-wy-z](?:-[0-9a-z]{2,8})+)*)?(-x(?:-[0-9a-z]{1,8})+)?$|^(x(?:-[0-9a-z]{1,8})+)$".
     */
    [k: string]: string;
  };
  /**
   * Department is a humain-readable designation of the organisational structure by a linguistic expression, within which the contact person works.
   */
  department?: string;
  /**
   * Department is a humain-readable designation of the organisational structure by a linguistic expression, within which the contact person works.
   */
  departments?: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|[0-9]{3}))?((?:-(?:[0-9a-z]{5,8}|[0-9][0-9a-z]{3}))*)?((?:-[0-9a-wy-z](?:-[0-9a-z]{2,8})+)*)?(-x(?:-[0-9a-z]{1,8})+)?$|^(x(?:-[0-9a-z]{1,8})+)$".
     */
    [k: string]: string;
  };
  /**
   * Role is the humain-readable responsibility of the contact person with respect to the object for which this person is the contact.
   */
  role?: string;
  /**
   * Role is the humain-readable responsibility of the contact person with respect to the object for which this person is the contact.
   */
  roles?: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|[0-9]{3}))?((?:-(?:[0-9a-z]{5,8}|[0-9][0-9a-z]{3}))*)?((?:-[0-9a-wy-z](?:-[0-9a-z]{2,8})+)*)?(-x(?:-[0-9a-z]{1,8})+)?$|^(x(?:-[0-9a-z]{1,8})+)$".
     */
    [k: string]: string;
  };
  telephones?: string[];
  faxes?: string[];
  x400s?: string[];
  uris?: string[];
  emails?: string[];
  [k: string]: unknown;
}
/**
 * Sender contains information about the party that is transmitting the message.
 */
export interface Party {
  /**
   * The id holds the identification of the party.
   */
  id: string;
  /**
   * Name is a human-readable name of the party.
   */
  name?: string;
  /**
   * Name is a human-readable name of the party.
   */
  names?: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|[0-9]{3}))?((?:-(?:[0-9a-z]{5,8}|[0-9][0-9a-z]{3}))*)?((?:-[0-9a-wy-z](?:-[0-9a-z]{2,8})+)*)?(-x(?:-[0-9a-z]{1,8})+)?$|^(x(?:-[0-9a-z]{1,8})+)$".
     */
    [k: string]: string;
  };
  /**
   * Contact provides contact information for the party in regard to the transmission of the message.
   */
  contacts?: ContactType[];
  [k: string]: unknown;
}
/**
 * AnnotableType is an abstract base type used for all annotable artefacts. Any type that provides for annotations should extend this type.
 */
export interface AnnotableType {
  annotations?: Annotations;
  /**
   * Links field is an array of link objects. Also used to specify the URI or the URN to itself. If appropriate, a collection of links to additional external resources.
   */
  links?: (
    | {
        [k: string]: unknown;
      }
    | {
        [k: string]: unknown;
      }
  )[];
  [k: string]: unknown;
}
/**
 * AnnotationType provides for non-documentation notes and annotations to be embedded in data and structure messages. It provides optional fields for providing a title, a type description, a URI, and the text of the annotation.
 */
export interface AnnotationType {
  /**
   * Non-standard identification of an annotation.
   */
  id?: string;
  /**
   * AnnotationTitle provides a title for the annotation.
   */
  title?: string;
  /**
   * AnnotationType is used to distinguish between annotations designed to support various uses. The types are not enumerated, as these can be specified by the user or creator of the annotations. The definitions and use of annotation types should be documented by their creator.
   */
  type?: string;
  /**
   * AnnotationText holds a language-specific string containing the text of the annotation.
   */
  text?: string;
  /**
   * AnnotationText holds a language-specific string containing the text of the annotation.
   */
  texts?: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|[0-9]{3}))?((?:-(?:[0-9a-z]{5,8}|[0-9][0-9a-z]{3}))*)?((?:-[0-9a-wy-z](?:-[0-9a-z]{2,8})+)*)?(-x(?:-[0-9a-z]{1,8})+)?$|^(x(?:-[0-9a-z]{1,8})+)$".
     */
    [k: string]: string;
  };
  /**
   * Links field is an array of link objects. Also used to specify the Annotation URL which points to an external resource which may contain or supplement the annotation (using 'self' as relationship). If a specific behavior is desired, an annotation type should be defined which specifies the use of this field more exactly. If appropriate, a collection of links to additional external resources.
   */
  links?: (
    | {
        [k: string]: unknown;
      }
    | {
        [k: string]: unknown;
      }
  )[];
  [k: string]: unknown;
}
/**
 * localisedText provides for a set of language-specific alternates to be provided for any human-readable constructs in the instance.
 */
export interface LocalisedText {
  /**
   * This interface was referenced by `undefined`'s JSON-Schema definition
   * via the `patternProperty` "^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|[0-9]{3}))?((?:-(?:[0-9a-z]{5,8}|[0-9][0-9a-z]{3}))*)?((?:-[0-9a-wy-z](?:-[0-9a-z]{2,8})+)*)?(-x(?:-[0-9a-z]{1,8})+)?$|^(x(?:-[0-9a-z]{1,8})+)$".
   */
  [k: string]: string;
}
/**
 * SimpleDataStructureRepresentationType defines the representation for any non-measure and non-time dimension data structure definition component.
 */
export interface SimpleDataStructureRepresentationType {
  /**
   * Urn reference to a codelist
   */
  enumeration?: string;
  enumerationFormat?: CodededTextFormatType;
  textFormat?: SimpleComponentTextFormatType;
  [k: string]: unknown;
}
/**
 * CodededTextFormatType is a restricted version of the SimpleComponentTextFormatType that only allows factets and text types applicable to codes. Although the time facets permit any value, an actual code identifier does not support the necessary characters for time. Therefore these facets should not contain time in their values.
 */
export interface CodededTextFormatType {
  endTime?: StandardTimePeriodType;
  endValue?: number;
  interval?: number;
  isSequence?: boolean;
  maxLength?: number;
  maxValue?: number;
  minLength?: number;
  minValue?: number;
  pattern?: string;
  startTime?: StandardTimePeriodType;
  startValue?: number;
  textType?: CodeDataType;
  timeInterval?: Duration;
  [k: string]: unknown;
}
/**
 * SimpleComponentTextFormatType is a restricted version of the BasicComponentTextFormatType that does not allow for multi-lingual values.
 */
export interface SimpleComponentTextFormatType {
  decimals?: number;
  endTime?: StandardTimePeriodType;
  endValue?: number;
  interval?: number;
  isSequence?: boolean;
  maxLength?: number;
  maxValue?: number;
  minLength?: number;
  minValue?: number;
  pattern?: string;
  startTime?: StandardTimePeriodType;
  startValue?: number;
  textType?: SimpleDataType;
  timeInterval?: Duration;
  [k: string]: unknown;
}
/**
 * AttributeRelationshipType defines the structure for stating the relationship between an attribute and other data structure definition components.
 */
export interface AttributeRelationshipType {
  attachmentGroups?: string[];
  dimensions?: string[];
  /**
   * Identifier of a local GroupKey Descriptor. This is used as a convenience to referencing all of the dimension defined by the referenced group. The attribute will also be attached to this group.
   */
  group?: string;
  /**
   * This means that value of the attribute will not vary with any of the other data structure components. This will always be treated as a data set level attribute.
   */
  none?: {
    [k: string]: unknown;
  };
  /**
   * Identifier of the local primary measure, where the reference to the data structure definition which defines the primary measure is provided in another context (for example the data structure definition in which the reference occurs). This is used to specify that the value of the attribute is dependent upon the observed value. An attribute with this relationship will always be treated as an observation level attribute.
   */
  primaryMeasure?: string;
  [k: string]: unknown;
}
/**
 * ReportingYearStartDayRepresentationType defines the representation for the reporting year start day attribute. Enumerated values are not allowed and the text format is fixed to be a day and month in the ISO 8601 format of '--MM-DD'.
 */
export interface ReportingYearStartDayRepresentationType {
  textFormat: ReportingYearStartDayTextFormatType;
  [k: string]: unknown;
}
/**
 * ReportingYearStartDayTextFormatType is a restricted version of the NonFacetedTextFormatType that fixes the value of the text type to be DayMonth. This type exists solely for the purpose of fixing the representation of the reporting year start day attribute.
 */
export interface ReportingYearStartDayTextFormatType {
  textType?: SimpleDataType;
  [k: string]: unknown;
}
/**
 * BaseDimensionRepresentationType is an abstract base which defines the representation for a measure dimension.
 */
export interface MeasureDimensionRepresentationType {
  /**
   * Urn reference to a concept scheme object.
   */
  enumeration: string;
  [k: string]: unknown;
}
/**
 * TimeDimensionRepresentationType defines the representation for the time dimension. Enumerated values are not allowed.
 */
export interface TimeDimensionRepresentationType {
  textFormat: TimeTextFormatType;
  [k: string]: unknown;
}
/**
 * TimeTextFormat is a restricted version of the SimpleComponentTextFormatType that only allows time based format and specifies a default ObservationalTimePeriod representation and facets of a start and end time.
 */
export interface TimeTextFormatType {
  endTime?: StandardTimePeriodType;
  startTime?: StandardTimePeriodType;
  textType?: TimeDataType;
  [k: string]: unknown;
}
/**
 * ConceptRepresentation defines the core representation that are allowed for a concept. The text format allowed for a concept is that which is allowed for any non-target object component.
 */
export interface ConceptRepresentation {
  /**
   * Urn reference to a codelist which enumerates the possible values that can be used as the representation of this concept.
   */
  enumeration?: string;
  enumerationFormat?: CodededTextFormatType;
  textFormat?: BasicComponentTextFormatType;
  [k: string]: unknown;
}
/**
 * BasicComponentTextFormatType is a restricted version of the TextFormatType that restricts the text type to the representations allowed for all components except for target objects.
 */
export interface BasicComponentTextFormatType {
  decimals?: number;
  endTime?: StandardTimePeriodType;
  endValue?: number;
  interval?: number;
  isMultiLingual?: boolean;
  isSequence?: boolean;
  maxLength?: number;
  maxValue?: number;
  minLength?: number;
  minValue?: number;
  pattern?: string;
  startTime?: StandardTimePeriodType;
  startValue?: number;
  textType?: BasicComponentDataType;
  timeInterval?: Duration;
  [k: string]: unknown;
}
/**
 * AttachmentConstraintAttachmentType defines the structure for specifying the object to which an attachment constraints applies.
 */
export interface AttachmentConstraintAttachmentType {
  dataSets?: {
    /**
     * DataProvider is a urn reference to a the provider of the data/metadata set.
     */
    dataProvider: string;
    /**
     * ID contains the identifier of the data/metadata set being referenced.
     */
    id: string;
    [k: string]: unknown;
  }[];
  dataStructures?: string[];
  dataflows?: string[];
  metadataSets?: {
    /**
     * DataProvider is a urn reference to a the provider of the data/metadata set.
     */
    dataProvider: string;
    /**
     * ID contains the identifier of the data/metadata set being referenced.
     */
    id: string;
    [k: string]: unknown;
  }[];
  metadataStructures?: string[];
  metadataflows?: string[];
  provisionAgreements?: string[];
  simpleDataSources?: string[];
  [k: string]: unknown;
}
/**
 * DataKeySetType defines a collection of full or partial data keys (dimension values).
 */
export interface DataKeySetType {
  isIncluded: boolean;
  keys: [
    {
      keyValues: [DataKeyValueType, ...DataKeyValueType[]];
      [k: string]: unknown;
    },
    ...{
      keyValues: [DataKeyValueType, ...DataKeyValueType[]];
      [k: string]: unknown;
    }[]
  ];
  [k: string]: unknown;
}
/**
 * DataKeyValueType is a type for providing a dimension value for the purpose of defining a distinct data key. Only a single value can be provided for the dimension.
 */
export interface DataKeyValueType {
  id: SingleNCNameIDType;
  value: SimpleKeyValueType;
  [k: string]: unknown;
}
/**
 * MetadataKeySetType defines a collection of metadata keys (identifier component values).
 */
export interface MetadataKeySetType {
  isIncluded: boolean;
  keys: [
    {
      metadataTarget: IdType;
      report: IdType;
      keyValues: [MetadataKeyValueType, ...MetadataKeyValueType[]];
      [k: string]: unknown;
    },
    ...{
      metadataTarget: IdType;
      report: IdType;
      keyValues: [MetadataKeyValueType, ...MetadataKeyValueType[]];
      [k: string]: unknown;
    }[]
  ];
  [k: string]: unknown;
}
/**
 * MetadataKeyValueType is a type for providing a target object value for the purpose of defining a distinct metadata key. Only a single value can be provided for the target object.
 */
export interface MetadataKeyValueType {
  id: SingleNCNameIDType;
  dataKey?: DataKeyType;
  dataSet?: SetReferenceType;
  /**
   * Urn reference to any object. The type of object actually referenced can be determined from the URN.
   */
  object?: string;
  value?: SimpleKeyValueType;
  [k: string]: unknown;
}
/**
 * DataKeyType is a region which defines a distinct full or partial data key. The key consists of a set of values, each referencing a dimension and providing a single value for that dimension. The purpose of the key is to define a subset of a data set (i.e. the observed value and data attribute) which have the dimension values provided in this definition. Any dimension not stated explicitly in this key is assumed to be wild carded, thus allowing for the definition of partial data keys.
 */
export interface DataKeyType {
  keyValues: [DataKeyValueType, ...DataKeyValueType[]];
  [k: string]: unknown;
}
/**
 * SetReferenceType defines the structure of a reference to a data/metadata set. A full reference to a data provider and the identifier for the data set must be provided. Note that this is not derived from the base reference structure since data/metadata sets are not technically identifiable.
 */
export interface SetReferenceType {
  /**
   * DataProvider is a urn reference to a the provider of the data/metadata set.
   */
  dataProvider: string;
  /**
   * ID contains the identifier of the data/metadata set being referenced.
   */
  id: string;
  [k: string]: unknown;
}
/**
 * AttributeValueSetType defines the structure for providing values for a data attribute. If no values are provided, the attribute is implied to include/excluded from the region in which it is defined, with no regard to the value of the data attribute. Note that for metadata attributes which occur within other metadata attributes, a nested identifier can be provided. For example, a value of CONTACT.ADDRESS.STREET refers to the metadata attribute with the identifier STREET which exists in the ADDRESS metadata attribute in the CONTACT metadata attribute, which is defined at the root of the report structure.
 */
export interface AttributeValueSetType {
  id: SingleNCNameIDType;
  timeRange?: TimeRangeValueType;
  values?: string[];
  cascadeValues?: string[];
  [k: string]: unknown;
}
/**
 * TimeRangeValueType allows a time period value to be expressed as a range. It can be expressed as the period before a period, after a period, or between two periods. Each of these properties can specify their inclusion in regards to the range.
 */
export interface TimeRangeValueType {
  /**
   * AfterPeriod is the period after which the period is meant to cover. This date may be inclusive or exclusive in the range.
   */
  afterPeriod?: {
    period?: ObservationalTimePeriodType;
    isInclusive?: boolean;
    [k: string]: unknown;
  };
  /**
   * BeforePeriod is the period before which the period is meant to cover. This date may be inclusive or exclusive in the range.
   */
  beforePeriod?: {
    period?: ObservationalTimePeriodType;
    isInclusive?: boolean;
    [k: string]: unknown;
  };
  /**
   * EndPeriod is the end period of the range. This date may be inclusive or exclusive in the range.
   */
  endPeriod?: {
    period?: ObservationalTimePeriodType;
    isInclusive?: boolean;
    [k: string]: unknown;
  };
  /**
   * StartPeriod is the start date or the range that the queried date must occur within. This date may be inclusive or exclusive in the range.
   */
  startPeriod?: {
    period?: ObservationalTimePeriodType;
    isInclusive?: boolean;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
/**
 * CubeRegionKeyType is a type for providing a set of values for a dimension for the purpose of defining a data cube region. A set of distinct value can be provided, or if this dimension is represented as time, and time range can be specified.
 */
export interface CubeRegionKeyType {
  id: SingleNCNameIDType;
  timeRange?: TimeRangeValueType;
  values?: string[];
  cascadeValues?: string[];
  [k: string]: unknown;
}
/**
 * MetadataAttributeValueSetType defines the structure for providing values for a metadata attribute. If no values are provided, the attribute is implied to include/excluded from the region in which it is defined, with no regard to the value of the metadata attribute.
 */
export interface MetadataAttributeValueSetType {
  id: NestedNCNameIDType;
  timeRange?: TimeRangeValueType;
  values?: string[];
  cascadeValues?: string[];
  [k: string]: unknown;
}
/**
 * MetadataTargetRegionKeyType is a type for providing a set of values for a target object in a metadata target of a refence metadata report. A set of values or a time range can be provided for a report period target object. A collection of the respective types of references can be provided for data set reference and identifiable object reference target objects. For a key descriptor values target object, a collection of data keys can be provided.
 */
export interface MetadataTargetRegionKeyType {
  id: SingleNCNameIDType;
  dataKeys?: DataKeyType[];
  dataSets?: SetReferenceType[];
  objects?: string[];
  timeRange?: TimeRangeValueType;
  values?: string[];
  [k: string]: unknown;
}
