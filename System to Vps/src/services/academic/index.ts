import { UniversityFaculty, UniversityCampus } from '../../types/database.types';
import { INITIAL_CAMPUSES } from './campuses';
import { AL_AZHAR_FACULTIES } from './alAzharFaculties';
import { PUBLIC_FACULTIES } from './publicFaculties';
import { PRIVATE_FACULTIES } from './privateFaculties';
import { NATIONAL_FACULTIES } from './nationalFaculties';
import { TECH_AND_INTERNATIONAL_FACULTIES } from './techAndInternationalFaculties';

export {
  INITIAL_CAMPUSES,
  AL_AZHAR_FACULTIES,
  PUBLIC_FACULTIES,
  PRIVATE_FACULTIES,
  NATIONAL_FACULTIES,
  TECH_AND_INTERNATIONAL_FACULTIES,
};

/**
 * Combines all accredited faculties and institutes into one master list,
 * deduplicated by faculty ID.
 */
export function getAllAccreditedFaculties(): UniversityFaculty[] {
  const allGroups = [
    ...AL_AZHAR_FACULTIES,
    ...PUBLIC_FACULTIES,
    ...PRIVATE_FACULTIES,
    ...NATIONAL_FACULTIES,
    ...TECH_AND_INTERNATIONAL_FACULTIES,
  ];

  const map = new Map<string, UniversityFaculty>();
  for (const fac of allGroups) {
    if (!map.has(fac.id)) {
      map.set(fac.id, fac);
    }
  }

  return Array.from(map.values());
}
