/**
 * Links field is an array of link objects. If appropriate, a collection of links to additional external resources for the header.
 */
export type Links = (
  | {
      [k: string]: unknown;
    }
  | {
      [k: string]: unknown;
    }
)[];
/**
 * localisedBestMatchText is a reusable element, used for providing a human-readable best-language-match texts.
 */
export type LocalisedBestMatchText = string;
export type Values = {
  id: string;
  name: LocalisedBestMatchText;
  names?: LocalisedText;
  description?: LocalisedBestMatchText;
  descriptions?: LocalisedText;
  start?: string;
  end?: string;
  parent?: string;
  order?: number;
  links?: Links;
  annotations?: number[];
  [k: string]: unknown;
}[];
export type Attrvalues = (null | {
  id?: string;
  name?: LocalisedBestMatchText;
  names?: LocalisedText;
  description?: LocalisedBestMatchText;
  descriptions?: LocalisedText;
  start?: string;
  end?: string;
  links?: Links;
  annotations?: number[];
  [k: string]: unknown;
})[];

/**
 * Schema for SDMX-JSON data message
 */
export interface SdmxJsonDataMessage {
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
      [k: string]: string;
    };
    /**
     * Name provides a name for the transmission. Multiple instances allow for parallel language values.
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
       * List of localised human-readable name of the party.
       */
      names?: {
        [k: string]: string;
      };
      /**
       * Contact provides contact information for the party in regard to the transmission of the message.
       */
      contact?: {
        /**
         * Name contains a humain-readable name for the contact.
         */
        name: string;
        /**
         * Name contains a humain-readable name for the contact.
         */
        names?: {
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
          [k: string]: string;
        };
        /**
         * Role is the responsibility of the contact person with respect to the object for which this person is the contact.
         */
        role?: string;
        /**
         * Role is the responsibility of the contact person with respect to the object for which this person is the contact.
         */
        roles?: {
          [k: string]: string;
        };
        telephones?: string[];
        faxes?: string[];
        x400s?: string[];
        uris?: string[];
        emails?: string[];
        [k: string]: unknown;
      }[];
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
    structure?: Structure;
    dataSets?: DataSet[];
    [k: string]: unknown;
  };
  /**
   * Errors field is an array of error objects. When appropriate provides a list of error messages in addition to RESTful web services HTTP error status codes.
   */
  errors?: Error[];
  [k: string]: unknown;
}
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
   * List of localised human-readable name of the party.
   */
  names?: {
    [k: string]: string;
  };
  /**
   * Contact provides contact information for the party in regard to the transmission of the message.
   */
  contact?: {
    /**
     * Name contains a humain-readable name for the contact.
     */
    name: string;
    /**
     * Name contains a humain-readable name for the contact.
     */
    names?: {
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
      [k: string]: string;
    };
    /**
     * Role is the responsibility of the contact person with respect to the object for which this person is the contact.
     */
    role?: string;
    /**
     * Role is the responsibility of the contact person with respect to the object for which this person is the contact.
     */
    roles?: {
      [k: string]: string;
    };
    telephones?: string[];
    faxes?: string[];
    x400s?: string[];
    uris?: string[];
    emails?: string[];
    [k: string]: unknown;
  }[];
  [k: string]: unknown;
}
export interface Structure {
  links?: Links;
  name?: LocalisedBestMatchText;
  names?: LocalisedText;
  description?: LocalisedBestMatchText;
  descriptions?: LocalisedText;
  dimensions: {
    dataSet?: Dimension[];
    series?: Dimension[];
    observation?: Dimension[];
    [k: string]: unknown;
  };
  attributes?: {
    dataSet?: Attribute[];
    series?: Attribute[];
    observation?: Attribute[];
    [k: string]: unknown;
  };
  annotations?: {
    /**
     * AnnotationTitle provides a title for the annotation.
     */
    title?: string;
    /**
     * AnnotationType is used to distinguish between annotations designed to support various uses. The types are not enumerated, as these can be specified by the user or creator of the annotations. The definitions and use of annotation types should be documented by their creator.
     */
    type?: string;
    /**
     * AnnotationText holds a best language match string containing the text of the annotation.
     */
    text?: string;
    /**
     * AnnotationText holds language-specific strings containing the texts of the annotation.
     */
    texts?: {
      [k: string]: string;
    };
    /**
     * Non-standard identification of an annotation.
     */
    id?: string;
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
  }[];
  [k: string]: unknown;
}
/**
 * localisedText provides for a set of language-specific alternates to be provided for any human-readable constructs in the instance.
 */
export interface LocalisedText {
  [k: string]: string;
}
export interface Dimension {
  id: string;
  name?: LocalisedBestMatchText;
  names?: LocalisedText;
  description?: LocalisedBestMatchText;
  descriptions?: LocalisedText;
  roles?: string[];
  keyPosition: number;
  default?: string;
  links?: Links;
  annotations?: number[];
  values: Values;
  [k: string]: unknown;
}
export interface Attribute {
  id: string;
  name?: LocalisedBestMatchText;
  names?: LocalisedText;
  description?: LocalisedBestMatchText;
  descriptions?: LocalisedText;
  roles?: string[];
  /**
   * AttributeRelationship describes how the value of this attribute varies with the values of other components. These relationships expresses the attachment level of the attribute.
   */
  relationship:
    | {
        [k: string]: unknown;
      }
    | {
        [k: string]: unknown;
      }
    | {
        [k: string]: unknown;
      };
  default?: string;
  links?: Links;
  annotations?: number[];
  values: Attrvalues;
  [k: string]: unknown;
}
export interface DataSet {
  action?: "Information" | "Append" | "Replace" | "Delete";
  reportingBegin?: string;
  reportingEnd?: string;
  validFrom?: string;
  validTo?: string;
  publicationYear?: string;
  publicationPeriod?: string;
  annotations?: number[];
  attributes?: (number | null)[];
  observations?: {
    [k: string]: (number | string | null)[];
  };
  series?: {
    [k: string]: {
      annotations?: number[];
      attributes?: (number | null)[];
      observations?: {
        [k: string]: (number | string | null)[];
      };
    };
  };
  links: Links;
  [k: string]: unknown;
}
/**
 * Error describes the structure of an error or warning message.
 */
export interface Error {
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
}
