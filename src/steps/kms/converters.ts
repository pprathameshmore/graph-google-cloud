import { cloudkms_v1 } from 'googleapis';
import {
  createIntegrationEntity,
  parseTimePropertyValue,
} from '@jupiterone/integration-sdk-core';
import {
  ENTITY_CLASS_KMS_KEY,
  ENTITY_CLASS_KMS_KEY_RING,
  ENTITY_TYPE_KMS_KEY,
  ENTITY_TYPE_KMS_KEY_RING,
} from './constants';
import { getGoogleCloudConsoleWebLink } from '../../utils/url';
import { googleCloudDurationSecondsToNumber } from '../../utils/time';

export interface KmsKeyRingParts {
  projectId: string;
  location: string;
  shortName: string;
}

/**
 * Example input: "projects/j1-gc-integration-dev/locations/us/keyRings/j1-gc-integration-dev-bucket-ring"
 *
 * Example output:
 *
 * {
 *   projectId: 'j1-gc-integration-dev',
 *   location: 'us'
 *   shortName: 'j1-gc-integration-dev-bucket-ring',
 * }
 */
export function getKmsKingRingParts(keyRingName: string) {
  const parts = keyRingName.split('/');

  return {
    projectId: parts[1],
    location: parts[3],
    shortName: parts[5],
  };
}

export function createKmsKeyRingEntity(data: cloudkms_v1.Schema$KeyRing) {
  const name = data.name as string;
  const parts = getKmsKingRingParts(name);

  return createIntegrationEntity({
    entityData: {
      source: data,
      assign: {
        _class: ENTITY_CLASS_KMS_KEY_RING,
        _type: ENTITY_TYPE_KMS_KEY_RING,
        _key: name,
        name,
        displayName: name,
        ...parts,
        createdOn: parseTimePropertyValue(data.createTime),
        webLink: getGoogleCloudConsoleWebLink(
          `/security/kms/keyring/manage/${parts.location}/${parts.shortName}/key?project=${parts.projectId}`,
        ),
      },
    },
  });
}

export function createKmsCryptoKeyEntity({
  cryptoKey,
  location,
  projectId,
  cryptoKeyRingShortName,
}: {
  cryptoKey: cloudkms_v1.Schema$CryptoKey;
  location: string;
  projectId: string;
  cryptoKeyRingShortName: string;
}) {
  const name = cryptoKey.name as string;

  return createIntegrationEntity({
    entityData: {
      source: cryptoKey,
      assign: {
        _class: ENTITY_CLASS_KMS_KEY,
        _type: ENTITY_TYPE_KMS_KEY,
        _key: name,
        name,
        displayName: name,
        createdOn: parseTimePropertyValue(cryptoKey.createTime),
        purpose: cryptoKey.purpose,
        keyUsage: cryptoKey.purpose,
        nextRotationTime: parseTimePropertyValue(cryptoKey.nextRotationTime),
        rotationPeriod: googleCloudDurationSecondsToNumber(
          cryptoKey.rotationPeriod,
        ),
        protectionLevel: cryptoKey.versionTemplate?.protectionLevel,
        algorithm: cryptoKey.versionTemplate?.algorithm,
        primaryName: cryptoKey.primary?.name,
        primaryState: cryptoKey.primary?.state,
        primaryCreateTime: parseTimePropertyValue(
          cryptoKey.primary?.createTime,
        ),
        primaryProtectionLevel: cryptoKey.primary?.protectionLevel,
        primaryAlgorithm: cryptoKey.primary?.algorithm,
        primaryGenerateTime: parseTimePropertyValue(
          cryptoKey.primary?.generateTime,
        ),
        webLink: getGoogleCloudConsoleWebLink(
          `/security/kms/key/manage/${location}/${cryptoKeyRingShortName}/${name}?project=${projectId}`,
        ),
      },
    },
  });
}
