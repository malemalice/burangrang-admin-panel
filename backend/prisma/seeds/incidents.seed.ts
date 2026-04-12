/**
 * Incident seed data
 * Following TRD.md patterns for seed data
 */
import {
  Incident,
  Room,
  IncidentTypeEnum,
  IncidentClassificationEnum,
  IncidentActivitiesEnum,
  IncidentScopeEnum,
  PriorityEnum,
  GeneralStatusEnum,
  SourceEnum,
  StopActivityEnum,
  TreatmentEnum,
  AbsenceEnum,
  GenderEnum,
  LevelOfInjuryEnum,
  InjuredBodyPartEnum,
  TypeOfInjuryEnum,
  MechanismOfInjuryEnum,
} from '@prisma/client';
import { seedPrisma as prisma } from './prisma-seed-client';

// Helper function to generate incident code: INC-YYYYMMDD-XXXX (general)
const generateIncidentCode = async (dateStr: string): Promise<string> => {
  const prefix = `INC-${dateStr}-`;
  const lastIncident = await prisma.incident.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
  });
  let sequence = 1;
  if (lastIncident) {
    const lastSequence = parseInt(lastIncident.code.slice(-4), 10);
    sequence = lastSequence + 1;
  }
  return `${prefix}${sequence.toString().padStart(4, '0')}`;
};

// Helper function to generate security incident code: SEC-YYYYMMDD-XXXX
const generateSecurityIncidentCode = async (dateStr: string): Promise<string> => {
  const prefix = `SEC-${dateStr}-`;
  const lastIncident = await prisma.incident.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
  });
  let sequence = 1;
  if (lastIncident) {
    const lastSequence = parseInt(lastIncident.code.slice(-4), 10);
    sequence = lastSequence + 1;
  }
  return `${prefix}${sequence.toString().padStart(4, '0')}`;
};

export const seedIncidents = async () => {
  console.log('🌱 Seeding incidents...');

  try {
    // Fetch required master data
    const users = await prisma.user.findMany({ where: { isActive: true } });
    const areas = await prisma.area.findMany({ where: { isActive: true } });
    const rooms = await prisma.room.findMany({ where: { isActive: true } });
    const riskCategories = await prisma.riskCategory.findMany({
      where: { isActive: true },
    });
    const securityRiskCategories = riskCategories.filter((c) => c.code.startsWith('SEC-'));
    const departments = await prisma.department.findMany({
      where: { isActive: true },
    });

    if (users.length === 0) {
      throw new Error('No users found. Please seed users first.');
    }
    if (areas.length === 0) {
      throw new Error('No areas found. Please seed areas first.');
    }
    if (riskCategories.length === 0) {
      throw new Error('No risk categories found. Please seed risk categories first.');
    }
    if (departments.length === 0) {
      throw new Error('No departments found. Please seed departments first.');
    }

    // Get technicians
    const technicians = users.filter((u) =>
      u.email?.includes('technician')
    );
    const techniciansList = technicians.length > 0 ? technicians : [users[0]];

    // Helper to get random item from array
    const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const randomItems = <T>(arr: T[], count: number): T[] => {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(count, arr.length));
    };

    // Generate dates for incidents spanning 24 months (Aug 2023 - Jul 2025)
    const generateDateInMonth = (year: number, month: number, day?: number): Date => {
      const d = new Date(year, month - 1, day ?? Math.floor(Math.random() * 28) + 1);
      return d;
    };

    // Incident templates - will be spread across Aug 2020 - Jul 2026 with varied dates
    // Distribution target: Fatality 1-2, Major 5-8, Minor 25-35, Near Miss 10-15, Hazard 15-20
    // LTICR: LTI incidents use absence=MORE_THAN_THREE_DAYS, activities=STUDY or WORK
    type IncidentTemplate = {
      subject: string;
      year: number;
      month: number;
      incidentType: IncidentTypeEnum;
      incidentClassification: IncidentClassificationEnum;
      priority: PriorityEnum;
      status: GeneralStatusEnum;
      description: string;
      controlMeasure: string;
      expectedOutcome: string;
      needToStopActivity: StopActivityEnum;
      stopActivityDescription: string | null;
      treatment: TreatmentEnum;
      treatmentDescription: string | null;
      absence: AbsenceEnum;
      resolution: string | null;
      hasInjuredPerson: boolean;
      hasWitness: boolean;
      hasAssets: boolean;
      activities?: IncidentActivitiesEnum; // default WORK; STUDY for study-related
    };

    const incidentTemplates: IncidentTemplate[] = [
      {
        subject: 'Slip and Fall in Corridor',
        year: 2025,
        month: 6,
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.OPEN,
        description: 'Employee slipped on wet floor in main corridor. Floor was recently mopped but warning signs were not placed.',
        controlMeasure: 'Immediate: Place warning signs. Long-term: Review cleaning procedures and ensure proper signage protocol.',
        expectedOutcome: 'Improved cleaning procedures and mandatory warning sign placement.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'Cleaning activity in the area was stopped until proper safety measures were in place.',
        treatment: TreatmentEnum.FIRST_AID,
        treatmentDescription: 'Minor bruising treated with ice pack and antiseptic.',
        absence: AbsenceEnum.RETURNED_AFTER_TREATMENT,
        resolution: 'Cleaning procedures updated. Warning signs now mandatory. Employee returned to work same day.',
        hasInjuredPerson: true,
        hasWitness: true,
        hasAssets: false,
      },
      {
        subject: 'Chemical Spill in Laboratory',
        year: 2025,
        month: 5,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MAJOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.CLOSE,
        description: 'Chemical container was knocked over during experiment, causing spill of hazardous material. Proper PPE was worn but spill containment was inadequate.',
        controlMeasure: 'Evacuate area. Contain spill using appropriate materials. Review chemical storage and handling procedures.',
        expectedOutcome: 'Improved chemical storage procedures and spill response training.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'All laboratory activities were stopped until area was properly decontaminated.',
        treatment: TreatmentEnum.MEDICAL_TREATMENT,
        treatmentDescription: 'Two personnel received medical evaluation. No serious injuries.',
        absence: AbsenceEnum.RETURNED_AFTER_TREATMENT,
        resolution: 'Area decontaminated. New spill response procedures implemented. All personnel trained on new procedures.',
        hasInjuredPerson: true,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Near Miss: Falling Object from Height',
        year: 2025,
        month: 5,
        incidentType: IncidentTypeEnum.NEAR_MISS,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.OPEN,
        description: 'Tool fell from scaffolding but did not hit anyone. Worker below was wearing hard hat which would have provided protection.',
        controlMeasure: 'Review tool tethering requirements. Ensure all tools are secured when working at height.',
        expectedOutcome: 'All workers at height must use tool tethers. Regular safety inspections implemented.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Tool tethering policy implemented. All workers trained on new requirements.',
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Electrical Equipment Malfunction',
        year: 2025,
        month: 4,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.CLOSE,
        description: 'Electrical panel showed signs of overheating. Equipment was immediately shut down. No fire occurred but potential for serious incident was high.',
        controlMeasure: 'Immediate shutdown. Electrical inspection required. Replace faulty components.',
        expectedOutcome: 'All electrical equipment inspected and maintained. Preventive maintenance schedule updated.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'Affected area power was shut down until inspection and repairs were completed.',
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Electrical panel repaired. All equipment inspected. Preventive maintenance schedule updated.',
        hasInjuredPerson: false,
        hasWitness: false,
        hasAssets: true,
      },
      {
        subject: 'Workplace Injury: Hand Laceration',
        year: 2025,
        month: 5,
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.OPEN,
        description: 'Employee cut hand while using cutting tool. Proper gloves were provided but not worn at time of incident.',
        controlMeasure: 'Immediate first aid. Review PPE compliance. Reinforce safety training on proper tool use.',
        expectedOutcome: '100% PPE compliance. Enhanced safety training completed.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.MEDICAL_TREATMENT,
        treatmentDescription: 'Laceration required stitches. Employee received tetanus shot.',
        absence: AbsenceEnum.RETURNED_AFTER_TREATMENT,
        resolution: 'PPE compliance improved. Safety training reinforced. Employee returned to work after medical clearance.',
        hasInjuredPerson: true,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Fire Alarm Activation - False Alarm',
        year: 2025,
        month: 5,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.OPEN,
        description: 'Fire alarm activated due to smoke from cooking activity. No actual fire. Building was evacuated as per procedure.',
        controlMeasure: 'Review cooking policies. Ensure proper ventilation. Test fire alarm system.',
        expectedOutcome: 'Cooking policies updated. Fire alarm system tested and verified.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'Building was evacuated. All activities stopped until all-clear was given.',
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Cooking policies updated. Fire alarm system tested. All systems operational.',
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: false,
      },
      {
        subject: 'Vehicle Accident in Parking Area',
        year: 2025,
        month: 4,
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.CLOSE,
        description: 'Two vehicles collided in parking area. Low speed collision. Both vehicles sustained minor damage.',
        controlMeasure: 'Review parking area layout. Consider speed bumps or additional signage. Driver safety training.',
        expectedOutcome: 'Improved parking area safety measures. Driver awareness training completed.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.MEDICAL_TREATMENT,
        treatmentDescription: 'Both drivers received medical evaluation. No serious injuries reported.',
        absence: AbsenceEnum.RETURNED_AFTER_TREATMENT,
        resolution: 'Parking area signage improved. Driver safety training completed. Both parties returned to work.',
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Ergonomic Issue: Repetitive Strain',
        year: 2025,
        month: 4,
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.OPEN,
        description: 'Employee reported wrist pain from repetitive computer work. Early intervention prevented more serious injury.',
        controlMeasure: 'Ergonomic assessment. Provide ergonomic equipment. Review work practices.',
        expectedOutcome: 'All workstations ergonomically assessed. Employees trained on proper ergonomics.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.MEDICAL_TREATMENT,
        treatmentDescription: 'Employee received medical consultation. Ergonomic equipment provided.',
        absence: AbsenceEnum.NOT_YET_KNOWN,
        resolution: 'Ergonomic equipment installed. Work practices reviewed. Employee continues work with accommodations.',
        hasInjuredPerson: true,
        hasWitness: false,
        hasAssets: false,
      },
      {
        subject: 'Gas Leak Detection',
        year: 2025,
        month: 4,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MAJOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.CLOSE,
        description: 'Gas leak detected in kitchen area. Immediate evacuation and gas supply shut off. No ignition occurred.',
        controlMeasure: 'Immediate evacuation. Shut off gas supply. Professional inspection and repair required.',
        expectedOutcome: 'All gas lines inspected. Leak repaired. Enhanced monitoring system installed.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'Entire building evacuated. Gas supply shut off. Area secured until repair completed.',
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: 'No injuries. All personnel accounted for after evacuation.',
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Gas leak repaired. All lines inspected. Enhanced monitoring system installed. Building reoccupied after safety clearance.',
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: false,
      },
      {
        subject: 'Near Miss: Forklift Collision Avoidance',
        year: 2025,
        month: 2,
        incidentType: IncidentTypeEnum.NEAR_MISS,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.OPEN,
        description: 'Forklift operator avoided collision with pedestrian by emergency stop. Pedestrian was in restricted area without proper authorization.',
        controlMeasure: 'Review pedestrian access controls. Enhance forklift operator training. Improve signage.',
        expectedOutcome: 'Improved access controls. Enhanced training for both operators and pedestrians.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Access controls improved. Training completed. No incidents since implementation.',
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Tripping Hazard: Loose Floor Tile',
        year: 2025,
        month: 7,
        incidentType: IncidentTypeEnum.NEAR_MISS,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.OPEN,
        description: 'Loose floor tile in hallway created tripping hazard. Employee noticed and reported before any accident occurred.',
        controlMeasure: 'Immediate: Mark area with warning signs. Schedule repair of loose tiles. Inspect entire floor for similar issues.',
        expectedOutcome: 'All loose tiles repaired. Regular floor inspection schedule implemented.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: null,
        hasInjuredPerson: false,
        hasWitness: false,
        hasAssets: false,
      },
      {
        subject: 'Burns from Hot Surface',
        year: 2025,
        month: 7,
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.OPEN,
        description: 'Employee touched hot equipment surface without proper protection. First degree burns on hand.',
        controlMeasure: 'Immediate first aid. Install warning signs on hot equipment. Review PPE requirements for equipment operation.',
        expectedOutcome: 'All hot equipment properly labeled. PPE compliance improved.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.FIRST_AID,
        treatmentDescription: 'Burns treated with cold water and burn cream. No further medical attention required.',
        absence: AbsenceEnum.RETURNED_AFTER_TREATMENT,
        resolution: null,
        hasInjuredPerson: true,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Water Leak in Server Room',
        year: 2025,
        month: 6,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MAJOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.OPEN,
        description: 'Water leak detected in server room from overhead pipe. Immediate action prevented equipment damage.',
        controlMeasure: 'Shut off water supply. Relocate critical equipment. Repair leak. Install leak detection system.',
        expectedOutcome: 'Leak repaired. Leak detection system installed. Equipment protection measures enhanced.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'Server room access restricted until leak repaired and area dried.',
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: null,
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Eye Injury from Flying Debris',
        year: 2025,
        month: 6,
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.OPEN,
        description: 'Employee working with grinding equipment was not wearing safety glasses. Small metal fragment entered eye.',
        controlMeasure: 'Immediate medical attention. Mandatory safety glasses for all grinding operations. Safety training reinforcement.',
        expectedOutcome: '100% PPE compliance for grinding operations. Enhanced safety awareness.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.MEDICAL_TREATMENT,
        treatmentDescription: 'Employee transported to hospital. Fragment removed. Eye protected with patch.',
        absence: AbsenceEnum.RETURNED_AFTER_TREATMENT,
        resolution: null,
        hasInjuredPerson: true,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Structural Damage: Ceiling Crack',
        year: 2025,
        month: 5,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.CLOSE,
        description: 'Large crack discovered in ceiling of office area. Structural engineer inspection required.',
        controlMeasure: 'Cordon off area. Structural engineer inspection. Repair if necessary.',
        expectedOutcome: 'Area inspected and repaired if needed. Regular structural inspections scheduled.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'Office area closed until inspection completed.',
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Structural engineer confirmed no immediate danger. Crack repaired. Area reopened.',
        hasInjuredPerson: false,
        hasWitness: false,
        hasAssets: false,
      },
      {
        subject: 'Near Miss: Falling Ladder',
        year: 2025,
        month: 5,
        incidentType: IncidentTypeEnum.NEAR_MISS,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.OPEN,
        description: 'Ladder fell from height but did not hit anyone. Worker was not in immediate area.',
        controlMeasure: 'Review ladder securing procedures. Ensure all ladders are properly secured when not in use.',
        expectedOutcome: 'All ladders properly secured. Workers trained on ladder safety.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: null,
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Back Injury from Lifting',
        year: 2025,
        month: 4,
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.CLOSE,
        description: 'Employee strained back while lifting heavy box without proper technique. No lifting equipment available.',
        controlMeasure: 'Immediate medical attention. Provide lifting equipment. Train employees on proper lifting techniques.',
        expectedOutcome: 'Lifting equipment available. All employees trained on proper lifting techniques.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.MEDICAL_TREATMENT,
        treatmentDescription: 'Employee received medical treatment. Prescribed rest and physical therapy.',
        absence: AbsenceEnum.NOT_YET_KNOWN,
        resolution: 'Lifting equipment procured. Training completed. Employee returned to work with restrictions.',
        hasInjuredPerson: true,
        hasWitness: false,
        hasAssets: false,
      },
      {
        subject: 'Exposure to Toxic Fumes',
        year: 2025,
        month: 4,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MAJOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.CLOSE,
        description: 'Employees exposed to toxic fumes from chemical reaction. Immediate evacuation and medical evaluation required.',
        controlMeasure: 'Evacuate area. Ventilate space. Medical evaluation for all exposed personnel. Review chemical handling procedures.',
        expectedOutcome: 'All personnel cleared medically. Chemical handling procedures updated. Ventilation improved.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'Area evacuated and secured until ventilation and safety measures verified.',
        treatment: TreatmentEnum.MEDICAL_TREATMENT,
        treatmentDescription: 'Three employees received medical evaluation. No serious effects reported.',
        absence: AbsenceEnum.RETURNED_AFTER_TREATMENT,
        resolution: 'Ventilation system upgraded. Chemical handling procedures revised. All personnel cleared to return.',
        hasInjuredPerson: true,
        hasWitness: true,
        hasAssets: false,
      },
      {
        subject: 'Near Miss: Vehicle Backing Incident',
        year: 2025,
        month: 3,
        incidentType: IncidentTypeEnum.NEAR_MISS,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.OPEN,
        description: 'Delivery vehicle nearly backed into pedestrian. Pedestrian was in blind spot. No contact made.',
        controlMeasure: 'Install backup cameras on vehicles. Improve pedestrian awareness. Review vehicle operation procedures.',
        expectedOutcome: 'All vehicles equipped with backup cameras. Pedestrian safety improved.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: null,
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Slip on Icy Surface',
        year: 2025,
        month: 3,
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.CLOSE,
        description: 'Employee slipped on icy surface in parking lot during winter. Minor bruising and sprain.',
        controlMeasure: 'Immediate: Salt and clear ice. Long-term: Improve winter maintenance procedures.',
        expectedOutcome: 'Improved winter maintenance. Regular ice clearing schedule implemented.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.FIRST_AID,
        treatmentDescription: 'Minor sprain treated with ice pack and compression bandage.',
        absence: AbsenceEnum.RETURNED_AFTER_TREATMENT,
        resolution: 'Winter maintenance procedures updated. Regular ice clearing schedule implemented.',
        hasInjuredPerson: true,
        hasWitness: false,
        hasAssets: false,
      },
      {
        subject: 'Equipment Malfunction: Press Machine',
        year: 2025,
        month: 2,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.OPEN,
        description: 'Press machine malfunctioned during operation. Safety guards activated preventing injury.',
        controlMeasure: 'Shut down equipment. Inspect and repair. Review maintenance schedule. Test safety systems.',
        expectedOutcome: 'Equipment repaired. Maintenance schedule updated. Safety systems verified.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'Equipment shut down until inspection and repair completed.',
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: null,
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Allergic Reaction to Chemical',
        year: 2025,
        month: 2,
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.OPEN,
        description: 'Employee developed allergic reaction after exposure to cleaning chemical. Rash and breathing difficulty.',
        controlMeasure: 'Immediate medical attention. Remove chemical from use. Review chemical safety data sheets.',
        expectedOutcome: 'Alternative chemical identified. All employees informed of chemical hazards.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.MEDICAL_TREATMENT,
        treatmentDescription: 'Employee received antihistamine and oxygen. Condition stabilized.',
        absence: AbsenceEnum.RETURNED_AFTER_TREATMENT,
        resolution: null,
        hasInjuredPerson: true,
        hasWitness: true,
        hasAssets: false,
      },
      {
        subject: 'Near Miss: Overhead Crane Load Swing',
        year: 2025,
        month: 1,
        incidentType: IncidentTypeEnum.NEAR_MISS,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.CLOSE,
        description: 'Overhead crane load swung unexpectedly but did not hit anyone. Operator maintained control.',
        controlMeasure: 'Review crane operation procedures. Ensure proper load securing. Operator training reinforcement.',
        expectedOutcome: 'Crane operation procedures updated. All operators retrained.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Crane operation procedures reviewed and updated. All operators completed additional training.',
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Noise Exposure: Hearing Protection Not Worn',
        year: 2024,
        month: 12,
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.OPEN,
        description: 'Employee worked in high noise area without hearing protection. Temporary hearing loss reported.',
        controlMeasure: 'Immediate: Provide hearing protection. Long-term: Noise assessment. Enforce PPE compliance.',
        expectedOutcome: 'Hearing protection mandatory in all high noise areas. Compliance monitoring implemented.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.MEDICAL_TREATMENT,
        treatmentDescription: 'Employee received hearing test. Hearing protection provided.',
        absence: AbsenceEnum.RETURNED_AFTER_TREATMENT,
        resolution: null,
        hasInjuredPerson: true,
        hasWitness: false,
        hasAssets: false,
      },
      {
        subject: 'Confined Space Entry Without Permit',
        year: 2024,
        month: 12,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MAJOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.CLOSE,
        description: 'Worker entered confined space without proper permit or safety measures. No incident occurred but serious violation.',
        controlMeasure: 'Immediate: Stop all confined space work. Review and enforce permit system. Retrain all workers.',
        expectedOutcome: 'Confined space entry procedures strictly enforced. All workers trained and certified.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'All confined space work stopped until procedures reviewed and enforced.',
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Confined space entry permit system implemented and enforced. All workers completed training.',
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: false,
      },
      {
        subject: 'Cut from Broken Glass',
        year: 2024,
        month: 12,
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.OPEN,
        description: 'Employee cut hand on broken glass while cleaning. Proper gloves were available but not used.',
        controlMeasure: 'Immediate first aid. Review cleaning procedures. Enforce PPE use during cleanup.',
        expectedOutcome: 'PPE compliance improved. Safe cleanup procedures established.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.FIRST_AID,
        treatmentDescription: 'Cut cleaned and bandaged. No stitches required.',
        absence: AbsenceEnum.RETURNED_AFTER_TREATMENT,
        resolution: null,
        hasInjuredPerson: true,
        hasWitness: false,
        hasAssets: false,
      },
      // FATALITY incident (rare) - FY 2023-2024, LTI study-related
      {
        subject: 'Fatal Fall from Height',
        year: 2024,
        month: 3,
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.FATALITY,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.CLOSE,
        description: 'Worker fell from scaffolding. Emergency services attended but worker succumbed to injuries.',
        controlMeasure: 'Immediate site shutdown. Full investigation. Reinforce fall protection requirements.',
        expectedOutcome: 'Enhanced fall protection. All workers at height retrained and certified.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'All work at height stopped pending investigation.',
        treatment: TreatmentEnum.HOSPITALIZATION,
        treatmentDescription: 'Emergency response. Pronounced at hospital.',
        absence: AbsenceEnum.MORE_THAN_THREE_DAYS,
        resolution: 'Fall protection systems upgraded. Mandatory harness use enforced.',
        hasInjuredPerson: true,
        hasWitness: true,
        hasAssets: true,
        activities: IncidentActivitiesEnum.STUDY,
      },
      // Additional incidents for 2024-2023 distribution
      { subject: 'Slippery Floor in Cafeteria', year: 2024, month: 11, incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.NORMAL, status: GeneralStatusEnum.CLOSE, description: 'Spill created slip hazard.', controlMeasure: 'Clean and mark area.', expectedOutcome: 'Improved spill response.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.NO_TREATMENT, treatmentDescription: null, absence: AbsenceEnum.NOT_SPECIFIED, resolution: null, hasInjuredPerson: false, hasWitness: true, hasAssets: false },
      { subject: 'Near Miss: Electrical Spark', year: 2024, month: 10, incidentType: IncidentTypeEnum.NEAR_MISS, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.NORMAL, status: GeneralStatusEnum.CLOSE, description: 'Electrical spark from faulty outlet. No fire.', controlMeasure: 'Replace outlet.', expectedOutcome: 'Electrical inspection completed.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.NO_TREATMENT, treatmentDescription: null, absence: AbsenceEnum.NOT_SPECIFIED, resolution: null, hasInjuredPerson: false, hasWitness: true, hasAssets: false },
      { subject: 'Minor Cut - Paper', year: 2024, month: 10, incidentType: IncidentTypeEnum.ACCIDENT, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.NORMAL, status: GeneralStatusEnum.CLOSE, description: 'Paper cut during document handling.', controlMeasure: 'First aid applied.', expectedOutcome: 'N/A', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.FIRST_AID, treatmentDescription: 'Bandaged.', absence: AbsenceEnum.RETURNED_AFTER_TREATMENT, resolution: null, hasInjuredPerson: true, hasWitness: false, hasAssets: false },
      { subject: 'Unguarded Machinery', year: 2024, month: 9, incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE, incidentClassification: IncidentClassificationEnum.MAJOR, priority: PriorityEnum.HIGH, status: GeneralStatusEnum.CLOSE, description: 'Guard removed from machine. Potential amputation risk.', controlMeasure: 'Install guard. Stop work.', expectedOutcome: 'All guards verified.', needToStopActivity: StopActivityEnum.YES, stopActivityDescription: 'Machine shut down.', treatment: TreatmentEnum.NO_TREATMENT, treatmentDescription: null, absence: AbsenceEnum.NOT_SPECIFIED, resolution: null, hasInjuredPerson: false, hasWitness: true, hasAssets: true },
      { subject: 'Near Miss: Dropped Tool', year: 2024, month: 9, incidentType: IncidentTypeEnum.NEAR_MISS, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.NORMAL, status: GeneralStatusEnum.CLOSE, description: 'Tool dropped from ladder. No one below.', controlMeasure: 'Tool tethering.', expectedOutcome: 'Tool tethers required.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.NO_TREATMENT, treatmentDescription: null, absence: AbsenceEnum.NOT_SPECIFIED, resolution: null, hasInjuredPerson: false, hasWitness: true, hasAssets: true },
      { subject: 'Strain from Awkward Posture', year: 2024, month: 8, incidentType: IncidentTypeEnum.ACCIDENT, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.NORMAL, status: GeneralStatusEnum.CLOSE, description: 'Neck strain from prolonged computer work.', controlMeasure: 'Ergonomic review.', expectedOutcome: 'Workstation adjusted.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.MEDICAL_TREATMENT, treatmentDescription: 'Physical therapy prescribed.', absence: AbsenceEnum.RETURNED_AFTER_TREATMENT, resolution: null, hasInjuredPerson: true, hasWitness: false, hasAssets: false },
      { subject: 'Blocked Fire Exit', year: 2024, month: 8, incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.HIGH, status: GeneralStatusEnum.CLOSE, description: 'Fire exit blocked by storage.', controlMeasure: 'Clear exit immediately.', expectedOutcome: 'Exit clearance audit.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.NO_TREATMENT, treatmentDescription: null, absence: AbsenceEnum.NOT_SPECIFIED, resolution: null, hasInjuredPerson: false, hasWitness: true, hasAssets: false },
      { subject: 'Near Miss: Chemical Splash', year: 2024, month: 7, incidentType: IncidentTypeEnum.NEAR_MISS, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.NORMAL, status: GeneralStatusEnum.CLOSE, description: 'Chemical splash on lab coat. No skin contact.', controlMeasure: 'Review PPE and handling.', expectedOutcome: 'Lab procedures updated.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.NO_TREATMENT, treatmentDescription: null, absence: AbsenceEnum.NOT_SPECIFIED, resolution: null, hasInjuredPerson: false, hasWitness: true, hasAssets: true },
      // LTI work-related - FY 2024-2025
      { subject: 'Major: Forklift Overturn', year: 2024, month: 9, incidentType: IncidentTypeEnum.ACCIDENT, incidentClassification: IncidentClassificationEnum.MAJOR, priority: PriorityEnum.HIGH, status: GeneralStatusEnum.CLOSE, description: 'Forklift overturned. Operator hospitalized.', controlMeasure: 'Emergency response. Investigate cause.', expectedOutcome: 'Forklift training refreshed.', needToStopActivity: StopActivityEnum.YES, stopActivityDescription: 'All forklift operations stopped.', treatment: TreatmentEnum.HOSPITALIZATION, treatmentDescription: 'Injuries treated at hospital.', absence: AbsenceEnum.MORE_THAN_THREE_DAYS, resolution: 'Training completed. Safe work procedures updated.', hasInjuredPerson: true, hasWitness: true, hasAssets: true, activities: IncidentActivitiesEnum.WORK },
      { subject: 'Hazard: Exposed Wiring', year: 2024, month: 5, incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.HIGH, status: GeneralStatusEnum.CLOSE, description: 'Exposed electrical wiring in corridor.', controlMeasure: 'Cordon off. Electrical repair.', expectedOutcome: 'All wiring inspected.', needToStopActivity: StopActivityEnum.YES, stopActivityDescription: 'Area closed.', treatment: TreatmentEnum.NO_TREATMENT, treatmentDescription: null, absence: AbsenceEnum.NOT_SPECIFIED, resolution: null, hasInjuredPerson: false, hasWitness: false, hasAssets: false },
      { subject: 'Near Miss: Pedestrian in Vehicle Zone', year: 2024, month: 4, incidentType: IncidentTypeEnum.NEAR_MISS, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.NORMAL, status: GeneralStatusEnum.CLOSE, description: 'Pedestrian crossed vehicle lane. Driver stopped in time.', controlMeasure: 'Improve signage and barriers.', expectedOutcome: 'Pedestrian routes clarified.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.NO_TREATMENT, treatmentDescription: null, absence: AbsenceEnum.NOT_SPECIFIED, resolution: null, hasInjuredPerson: false, hasWitness: true, hasAssets: false },
      { subject: 'Sprain from Trip', year: 2024, month: 3, incidentType: IncidentTypeEnum.ACCIDENT, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.NORMAL, status: GeneralStatusEnum.CLOSE, description: 'Employee tripped over cable. Ankle sprain.', controlMeasure: 'Cable management. First aid.', expectedOutcome: 'Cable routing improved.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.FIRST_AID, treatmentDescription: 'RICE protocol.', absence: AbsenceEnum.RETURNED_AFTER_TREATMENT, resolution: null, hasInjuredPerson: true, hasWitness: true, hasAssets: false },
      { subject: 'Smoke from Overheating Equipment', year: 2024, month: 2, incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.HIGH, status: GeneralStatusEnum.CLOSE, description: 'Equipment overheated. Smoke detected. No fire.', controlMeasure: 'Shutdown. Ventilate. Inspect.', expectedOutcome: 'Maintenance schedule updated.', needToStopActivity: StopActivityEnum.YES, stopActivityDescription: 'Equipment powered off.', treatment: TreatmentEnum.NO_TREATMENT, treatmentDescription: null, absence: AbsenceEnum.NOT_SPECIFIED, resolution: null, hasInjuredPerson: false, hasWitness: true, hasAssets: true },
      { subject: 'Near Miss: Falling Debris', year: 2024, month: 1, incidentType: IncidentTypeEnum.NEAR_MISS, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.NORMAL, status: GeneralStatusEnum.CLOSE, description: 'Debris fell from construction above. Exclusion zone effective.', controlMeasure: 'Maintain exclusion zones.', expectedOutcome: 'Exclusion zone procedures verified.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.NO_TREATMENT, treatmentDescription: null, absence: AbsenceEnum.NOT_SPECIFIED, resolution: null, hasInjuredPerson: false, hasWitness: true, hasAssets: false },
      // LTI FY 2024-2025 study-related
      { subject: 'Student Fracture During PE Class', year: 2025, month: 1, incidentType: IncidentTypeEnum.ACCIDENT, incidentClassification: IncidentClassificationEnum.MAJOR, priority: PriorityEnum.HIGH, status: GeneralStatusEnum.CLOSE, description: 'Student fractured leg during physical education activity. Extended absence for recovery.', controlMeasure: 'Review PE safety procedures. Ensure proper supervision.', expectedOutcome: 'PE safety protocols updated.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.HOSPITALIZATION, treatmentDescription: 'Fracture treated. Cast applied.', absence: AbsenceEnum.MORE_THAN_THREE_DAYS, resolution: 'Student returned after recovery. PE procedures reviewed.', hasInjuredPerson: true, hasWitness: true, hasAssets: false, activities: IncidentActivitiesEnum.STUDY },
      // LTI FY 2025-2026
      { subject: 'Workplace Fall Resulting in Extended Absence', year: 2025, month: 9, incidentType: IncidentTypeEnum.ACCIDENT, incidentClassification: IncidentClassificationEnum.MAJOR, priority: PriorityEnum.HIGH, status: GeneralStatusEnum.CLOSE, description: 'Employee fell in warehouse. Back injury required extended recovery.', controlMeasure: 'Improve floor condition. Slip-resistant footwear.', expectedOutcome: 'Warehouse safety improved.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.HOSPITALIZATION, treatmentDescription: 'Back injury treated. Extended rehab.', absence: AbsenceEnum.MORE_THAN_THREE_DAYS, resolution: 'Employee returned with restrictions.', hasInjuredPerson: true, hasWitness: true, hasAssets: true, activities: IncidentActivitiesEnum.WORK },
      { subject: 'Lab Injury Requiring Extended Recovery', year: 2026, month: 2, incidentType: IncidentTypeEnum.ACCIDENT, incidentClassification: IncidentClassificationEnum.MAJOR, priority: PriorityEnum.HIGH, status: GeneralStatusEnum.OPEN, description: 'Student injured hand in science lab. Required surgery and extended recovery.', controlMeasure: 'Review lab safety. Enhance supervision.', expectedOutcome: 'Lab procedures strengthened.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.HOSPITALIZATION, treatmentDescription: 'Hand surgery. Rehab ongoing.', absence: AbsenceEnum.MORE_THAN_THREE_DAYS, resolution: null, hasInjuredPerson: true, hasWitness: true, hasAssets: true, activities: IncidentActivitiesEnum.STUDY },
      // Supporting recordable incidents for 2020-2022 (non-LTI, for context)
      { subject: 'Minor Cut in Workshop', year: 2020, month: 11, incidentType: IncidentTypeEnum.ACCIDENT, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.NORMAL, status: GeneralStatusEnum.CLOSE, description: 'Employee cut finger in workshop. First aid applied.', controlMeasure: 'PPE compliance. Tool safety.', expectedOutcome: 'Workshop safety improved.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.FIRST_AID, treatmentDescription: 'Bandaged. Returned same day.', absence: AbsenceEnum.RETURNED_AFTER_TREATMENT, resolution: 'PPE reinforced.', hasInjuredPerson: true, hasWitness: true, hasAssets: true },
      { subject: 'Spill Hazard in Corridor', year: 2021, month: 5, incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.NORMAL, status: GeneralStatusEnum.CLOSE, description: 'Liquid spill in corridor. Slip hazard identified.', controlMeasure: 'Immediate cleanup. Warning signs.', expectedOutcome: 'Spill response procedures.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.NO_TREATMENT, treatmentDescription: null, absence: AbsenceEnum.NOT_SPECIFIED, resolution: 'Cleaning schedule updated.', hasInjuredPerson: false, hasWitness: true, hasAssets: false },
      { subject: 'Bruise from Collision', year: 2021, month: 9, incidentType: IncidentTypeEnum.ACCIDENT, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.NORMAL, status: GeneralStatusEnum.CLOSE, description: 'Two students collided in hallway. Minor bruising.', controlMeasure: 'Traffic flow review. Supervision.', expectedOutcome: 'Hallway safety improved.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.FIRST_AID, treatmentDescription: 'Ice pack. Returned same day.', absence: AbsenceEnum.RETURNED_AFTER_TREATMENT, resolution: 'Traffic flow reviewed.', hasInjuredPerson: true, hasWitness: true, hasAssets: false },
      { subject: 'Exposed Wire in Classroom', year: 2022, month: 3, incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.HIGH, status: GeneralStatusEnum.CLOSE, description: 'Exposed wire found in classroom. Electrical hazard.', controlMeasure: 'Cordon off. Electrician repair.', expectedOutcome: 'All classrooms inspected.', needToStopActivity: StopActivityEnum.YES, stopActivityDescription: 'Room closed until repair.', treatment: TreatmentEnum.NO_TREATMENT, treatmentDescription: null, absence: AbsenceEnum.NOT_SPECIFIED, resolution: 'Wire repaired. Inspection completed.', hasInjuredPerson: false, hasWitness: false, hasAssets: false },
      // LTI FY 2022-2023 study-related
      { subject: 'Student Injured During Sports Activity', year: 2022, month: 11, incidentType: IncidentTypeEnum.ACCIDENT, incidentClassification: IncidentClassificationEnum.MAJOR, priority: PriorityEnum.HIGH, status: GeneralStatusEnum.CLOSE, description: 'Student sustained injury during sports. Required extended recovery.', controlMeasure: 'Sports safety review. Proper warm-up.', expectedOutcome: 'Sports safety protocols updated.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.HOSPITALIZATION, treatmentDescription: 'Injury treated. Extended recovery.', absence: AbsenceEnum.MORE_THAN_THREE_DAYS, resolution: 'Student returned after recovery.', hasInjuredPerson: true, hasWitness: true, hasAssets: false, activities: IncidentActivitiesEnum.STUDY },
      { subject: 'Bruise from Door Impact', year: 2023, month: 12, incidentType: IncidentTypeEnum.ACCIDENT, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.NORMAL, status: GeneralStatusEnum.CLOSE, description: 'Door swung into employee. Arm bruising.', controlMeasure: 'Install door stops.', expectedOutcome: 'Door safety review.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.FIRST_AID, treatmentDescription: 'Ice pack.', absence: AbsenceEnum.RETURNED_AFTER_TREATMENT, resolution: null, hasInjuredPerson: true, hasWitness: false, hasAssets: false },
      { subject: 'Hazard: Leaking Pipe', year: 2023, month: 11, incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.NORMAL, status: GeneralStatusEnum.CLOSE, description: 'Pipe leak in basement. Slip hazard potential.', controlMeasure: 'Repair pipe. Dry area.', expectedOutcome: 'Leak repaired.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.NO_TREATMENT, treatmentDescription: null, absence: AbsenceEnum.NOT_SPECIFIED, resolution: null, hasInjuredPerson: false, hasWitness: false, hasAssets: false },
      { subject: 'Near Miss: Manual Handling', year: 2023, month: 10, incidentType: IncidentTypeEnum.NEAR_MISS, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.NORMAL, status: GeneralStatusEnum.CLOSE, description: 'Employee nearly dropped heavy box. No injury.', controlMeasure: 'Provide lifting aids.', expectedOutcome: 'Lifting equipment procured.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.NO_TREATMENT, treatmentDescription: null, absence: AbsenceEnum.NOT_SPECIFIED, resolution: null, hasInjuredPerson: false, hasWitness: true, hasAssets: true },
      { subject: 'Chemical Burn - Minor', year: 2023, month: 9, incidentType: IncidentTypeEnum.ACCIDENT, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.HIGH, status: GeneralStatusEnum.CLOSE, description: 'Minor chemical burn from cleaning product.', controlMeasure: 'Flush with water. Review SDS.', expectedOutcome: 'Chemical handling training.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.FIRST_AID, treatmentDescription: 'Flushed and bandaged.', absence: AbsenceEnum.RETURNED_AFTER_TREATMENT, resolution: null, hasInjuredPerson: true, hasWitness: true, hasAssets: false },
      { subject: 'Hazard: Unstable Stack', year: 2023, month: 8, incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE, incidentClassification: IncidentClassificationEnum.MINOR, priority: PriorityEnum.NORMAL, status: GeneralStatusEnum.CLOSE, description: 'Unstable material stack. Collapse risk.', controlMeasure: 'Restack safely.', expectedOutcome: 'Stacking procedures updated.', needToStopActivity: StopActivityEnum.NO, stopActivityDescription: null, treatment: TreatmentEnum.NO_TREATMENT, treatmentDescription: null, absence: AbsenceEnum.NOT_SPECIFIED, resolution: null, hasInjuredPerson: false, hasWitness: true, hasAssets: true },
    ];

    // Security incident templates (type: SECURITY)
    const securityIncidentTemplates: IncidentTemplate[] = [
      {
        subject: 'Unauthorized Access Attempt - Main Gate',
        year: 2025,
        month: 7,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MAJOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.OPEN,
        description: 'Individual attempted to enter premises without valid ID. Stopped by security. No tailgating protocol was followed by preceding employee.',
        controlMeasure: 'Reinforce gate protocol. Brief all staff on no tailgating. Review access control logs.',
        expectedOutcome: 'Stricter gate checks. Access control awareness training completed.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: null,
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: false,
      },
      {
        subject: 'Theft of Company Equipment from Warehouse',
        year: 2025,
        month: 6,
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.MAJOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.CLOSE,
        description: 'Laptop and tools reported missing from locked warehouse. Investigation found door was left unsecured during shift change.',
        controlMeasure: 'Immediate: Lockdown and audit. Review key handover procedure. Install additional CCTV.',
        expectedOutcome: 'Key handover procedure updated. CCTV coverage improved. Loss reported to authorities.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'Warehouse access restricted until audit and procedure review completed.',
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Procedures updated. CCTV installed. Police report filed.',
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Tailgating Incident - Unauthorized Person in Restricted Area',
        year: 2025,
        month: 6,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.OPEN,
        description: 'Contractor followed employee through access-controlled door without badging. Detected by security patrol 20 minutes later.',
        controlMeasure: 'Remind staff not to allow tailgating. Contractor escort policy reinforced. Signage at all controlled doors.',
        expectedOutcome: 'Tailgating awareness campaign. Contractor escort requirement enforced.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: null,
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: false,
      },
      {
        subject: 'Data Breach Attempt - Phishing Email Reported',
        year: 2025,
        month: 5,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MAJOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.CLOSE,
        description: 'Employee received suspicious email requesting credentials. Reported to IT. No credentials were shared. Email blocked and traced.',
        controlMeasure: 'IT security alert. Block sender. Scan network. Mandatory phishing awareness training.',
        expectedOutcome: 'Phishing training completed. Email filters updated. No data compromise confirmed.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Sender blocked. Training completed. No breach confirmed.',
        hasInjuredPerson: false,
        hasWitness: false,
        hasAssets: false,
      },
      {
        subject: 'Security Guard Assault - Intruder Resisting Arrest',
        year: 2025,
        month: 5,
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.MAJOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.CLOSE,
        description: 'Intruder refused to leave and assaulted security guard. Police called. Guard sustained minor injuries.',
        controlMeasure: 'Emergency response. Medical attention for guard. Police report. Review de-escalation and use-of-force policy.',
        expectedOutcome: 'Guard cleared medically. Intruder charged. Security procedures reviewed.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'Area secured. Police attended.',
        treatment: TreatmentEnum.MEDICAL_TREATMENT,
        treatmentDescription: 'Guard treated for minor cuts and bruising.',
        absence: AbsenceEnum.RETURNED_AFTER_TREATMENT,
        resolution: 'Guard returned to duty. Legal action pursued. Procedures updated.',
        hasInjuredPerson: true,
        hasWitness: true,
        hasAssets: false,
      },
      {
        subject: 'Suspicious Package Left at Reception',
        year: 2025,
        month: 4,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MAJOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.CLOSE,
        description: 'Unattended package found at reception. Evacuation and bomb squad called. Package was later confirmed as harmless (lost delivery).',
        controlMeasure: 'Evacuate area. Do not touch package. Notify authorities. Follow suspicious item protocol.',
        expectedOutcome: 'All clear given. Reception procedures updated. Staff trained on suspicious items.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'Building evacuated until all clear from authorities.',
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'All clear. Procedures documented. Training completed.',
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: false,
      },
      {
        subject: 'After-Hours Intrusion Alarm - Office Building',
        year: 2025,
        month: 4,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.OPEN,
        description: 'Alarm triggered in office block at 02:00. Security and police attended. No intruder found; cause was faulty window sensor.',
        controlMeasure: 'Inspect sensor. Repair or replace. Review alarm response procedure.',
        expectedOutcome: 'Sensor repaired. False alarm rate reduced. Response procedure verified.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: null,
        hasInjuredPerson: false,
        hasWitness: false,
        hasAssets: true,
      },
      {
        subject: 'Visitor Without Appointment - Aggressive Behavior',
        year: 2025,
        month: 3,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.CLOSE,
        description: 'Visitor demanded entry without appointment and became aggressive when refused. Security de-escalated. Police notified.',
        controlMeasure: 'De-escalation. Do not allow entry. Notify security and police if needed. Log incident.',
        expectedOutcome: 'Visitor removed from premises. Incident logged. Staff trained on handling difficult visitors.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Visitor left. No injuries. Procedures reinforced.',
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: false,
      },
      {
        subject: 'Lost Access Badge - Found in Parking Lot',
        year: 2025,
        month: 3,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.OPEN,
        description: 'Employee access badge found in parking lot by another staff member. Badge was deactivated immediately. New badge issued.',
        controlMeasure: 'Deactivate badge immediately. Issue new badge. Remind staff to report lost badges. Review badge policy.',
        expectedOutcome: 'Badge deactivated. Employee re-badged. Awareness on reporting lost badges.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: null,
        hasInjuredPerson: false,
        hasWitness: false,
        hasAssets: false,
      },
      {
        subject: 'Vandalism - Graffiti on Perimeter Fence',
        year: 2025,
        month: 2,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.CLOSE,
        description: 'Graffiti discovered on perimeter fence. No breach. CCTV reviewed; incident occurred overnight. Cleanup arranged.',
        controlMeasure: 'Document and photograph. Arrange cleanup. Review CCTV. Increase patrol if needed.',
        expectedOutcome: 'Fence cleaned. Patrol schedule reviewed. No repeat incident.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Cleanup completed. Patrols adjusted.',
        hasInjuredPerson: false,
        hasWitness: false,
        hasAssets: false,
      },
      {
        subject: 'Near Miss: Unauthorized Vehicle in Restricted Zone',
        year: 2025,
        month: 1,
        incidentType: IncidentTypeEnum.NEAR_MISS,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.CLOSE,
        description: 'Delivery driver entered restricted zone. Stopped by security before reaching sensitive area. Driver was lost and had wrong gate pass.',
        controlMeasure: 'Clarify delivery routes and gate passes. Improve signage. Brief delivery contractors.',
        expectedOutcome: 'Delivery routes documented. Contractors briefed. No unauthorized access occurred.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Routes and passes updated. No breach.',
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Workplace Violence Threat - Disgruntled Former Employee',
        year: 2024,
        month: 11,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MAJOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.CLOSE,
        description: 'Former employee made threatening remarks at reception. Security and police called. Individual was removed and trespass notice issued.',
        controlMeasure: 'Do not engage. Call security and police. Issue trespass notice. Update access list. Restraining order considered.',
        expectedOutcome: 'Individual removed. Trespass notice in place. HR and legal informed.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'Reception area secured until individual removed.',
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Trespass notice issued. Access revoked. Staff supported.',
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: false,
      },
      {
        subject: 'CCTV Camera Tampering Detected',
        year: 2024,
        month: 10,
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.CLOSE,
        description: 'One CCTV camera in warehouse showed offline. On inspection, cable was disconnected. No footage of who did it. Camera restored.',
        controlMeasure: 'Restore camera. Secure cabling. Review other cameras. Investigate who had access.',
        expectedOutcome: 'All cameras operational. Cabling secured. Access to camera locations restricted.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Camera restored. Cabling secured. Investigation inconclusive.',
        hasInjuredPerson: false,
        hasWitness: false,
        hasAssets: true,
      },
    ];

    const createdIncidents: Incident[] = [];
    const usedRoomIds = new Set<string>(); // Track used rooms to avoid unique constraint violation

    for (const t of incidentTemplates) {
      const incidentDate = generateDateInMonth(t.year, t.month);
      const dueDate = new Date(incidentDate);
      dueDate.setDate(dueDate.getDate() + 14);
      const dateStr = incidentDate.toISOString().slice(0, 10).replace(/-/g, '');
      const code = await generateIncidentCode(dateStr);

      // Select random related entities
      const area = randomItem(areas);
      // Only assign a room if there are unused rooms available (roomId has unique constraint)
      let room: Room | null = null;
      if (rooms.length > 0) {
        const availableRooms = rooms.filter((r) => !usedRoomIds.has(r.id));
        if (availableRooms.length > 0) {
          room = randomItem(availableRooms);
          usedRoomIds.add(room.id);
        }
      }
      const riskCategory = randomItem(riskCategories);
      const requester = randomItem(users);
      const reporter = randomItem(users);
      const technician = Math.random() > 0.5 ? randomItem(techniciansList) : null;
      const assignedDepartment = randomItem(departments);
      const assignee = Math.random() > 0.7 ? randomItem(users) : null;
      const creator = randomItem(users);

      // Create injured persons if needed
      const injuredPersons = t.hasInjuredPerson
        ? [
            {
              injuredPersonName: 'John Doe',
              gender: GenderEnum.MALE,
              levelOfInjury: LevelOfInjuryEnum.MINOR,
              injuredBodyPart: InjuredBodyPartEnum.HAND,
              typeOfInjury: TypeOfInjuryEnum.LACERATION,
              mechanismOfInjury: MechanismOfInjuryEnum.HAND_TOOLS,
              departmentId: randomItem(departments).id,
              order: 1,
            },
          ]
        : [];

      // Create witnesses if needed
      const witnesses = t.hasWitness
        ? [
            {
              witnessName: 'Jane Smith',
              gender: GenderEnum.FEMALE,
              departmentId: randomItem(departments).id,
              order: 1,
            },
            ...(Math.random() > 0.5
              ? [
                  {
                    witnessName: 'Bob Johnson',
                    gender: GenderEnum.MALE,
                    departmentId: randomItem(departments).id,
                    order: 2,
                  },
                ]
              : []),
          ]
        : [];

      // Create assets if needed
      const assets = t.hasAssets
        ? [
            {
              assetName: 'Safety Equipment',
              assetCode: 'SAFE-001',
              quantity: 1,
              order: 1,
            },
            ...(Math.random() > 0.5
              ? [
                  {
                    assetName: 'Tool Set',
                    assetCode: 'TOOL-001',
                    quantity: 1,
                    order: 2,
                  },
                ]
              : []),
          ]
        : [];

      const incident = await prisma.incident.create({
        data: {
          code,
          subject: t.subject,
          incidentDate,
          roomId: room?.id,
          areaId: area.id,
          incidentType: t.incidentType,
          incidentClassification: t.incidentClassification,
          activities: t.activities ?? IncidentActivitiesEnum.WORK,
          type: IncidentScopeEnum.GENERAL,
          requesterId: requester.id,
          reportedBy: reporter.id,
          technicianId: technician?.id,
          priority: t.priority,
          riskCategoryId: riskCategory.id,
          description: t.description,
          controlMeasure: t.controlMeasure,
          dueDate,
          expectedOutcome: t.expectedOutcome,
          needToStopActivity: t.needToStopActivity,
          stopActivityDescription: t.stopActivityDescription,
          treatment: t.treatment,
          treatmentDescription: t.treatmentDescription,
          absence: t.absence,
          resolution: t.resolution,
          assignedDepartmentId: assignedDepartment.id,
          assigneeId: assignee?.id,
          status: t.status,
          source: SourceEnum.SYSTEM,
          isActive: true,
          createdBy: creator.id,
          injuredPersons: injuredPersons.length > 0 ? { create: injuredPersons } : undefined,
          witnesses: witnesses.length > 0 ? { create: witnesses } : undefined,
          assets: assets.length > 0 ? { create: assets } : undefined,
        },
      });

      createdIncidents.push(incident);
      console.log(`✅ Created incident: ${incident.code} - ${t.subject}`);
    }

    // Create security incidents (type: SECURITY) — use only SEC- prefixed risk categories
    const categoriesForSecurity = securityRiskCategories.length > 0 ? securityRiskCategories : riskCategories;
    for (const t of securityIncidentTemplates) {
      const incidentDate = generateDateInMonth(t.year, t.month);
      const dueDate = new Date(incidentDate);
      dueDate.setDate(dueDate.getDate() + 14);
      const dateStr = incidentDate.toISOString().slice(0, 10).replace(/-/g, '');
      const code = await generateSecurityIncidentCode(dateStr);

      const area = randomItem(areas);
      let room: Room | null = null;
      if (rooms.length > 0) {
        const availableRooms = rooms.filter((r) => !usedRoomIds.has(r.id));
        if (availableRooms.length > 0) {
          room = randomItem(availableRooms);
          usedRoomIds.add(room.id);
        }
      }
      const riskCategory = randomItem(categoriesForSecurity);
      const requester = randomItem(users);
      const reporter = randomItem(users);
      const technician = Math.random() > 0.5 ? randomItem(techniciansList) : null;
      const assignedDepartment = randomItem(departments);
      const assignee = Math.random() > 0.7 ? randomItem(users) : null;
      const creator = randomItem(users);

      const injuredPersons = t.hasInjuredPerson
        ? [
            {
              injuredPersonName: 'John Doe',
              gender: GenderEnum.MALE,
              levelOfInjury: LevelOfInjuryEnum.MINOR,
              injuredBodyPart: InjuredBodyPartEnum.HAND,
              typeOfInjury: TypeOfInjuryEnum.LACERATION,
              mechanismOfInjury: MechanismOfInjuryEnum.HAND_TOOLS,
              departmentId: randomItem(departments).id,
              order: 1,
            },
          ]
        : [];

      const witnesses = t.hasWitness
        ? [
            {
              witnessName: 'Jane Smith',
              gender: GenderEnum.FEMALE,
              departmentId: randomItem(departments).id,
              order: 1,
            },
            ...(Math.random() > 0.5
              ? [
                  {
                    witnessName: 'Bob Johnson',
                    gender: GenderEnum.MALE,
                    departmentId: randomItem(departments).id,
                    order: 2,
                  },
                ]
              : []),
          ]
        : [];

      const assets = t.hasAssets
        ? [
            {
              assetName: 'Security Equipment',
              assetCode: 'SEC-001',
              quantity: 1,
              order: 1,
            },
            ...(Math.random() > 0.5
              ? [
                  {
                    assetName: 'CCTV Unit',
                    assetCode: 'CCTV-001',
                    quantity: 1,
                    order: 2,
                  },
                ]
              : []),
          ]
        : [];

      const incident = await prisma.incident.create({
        data: {
          code,
          subject: t.subject,
          incidentDate,
          roomId: room?.id,
          areaId: area.id,
          incidentType: t.incidentType,
          incidentClassification: t.incidentClassification,
          activities: t.activities ?? IncidentActivitiesEnum.WORK,
          type: IncidentScopeEnum.SECURITY,
          requesterId: requester.id,
          reportedBy: reporter.id,
          technicianId: technician?.id,
          priority: t.priority,
          riskCategoryId: riskCategory.id,
          description: t.description,
          controlMeasure: t.controlMeasure,
          dueDate,
          expectedOutcome: t.expectedOutcome,
          needToStopActivity: t.needToStopActivity,
          stopActivityDescription: t.stopActivityDescription,
          treatment: t.treatment,
          treatmentDescription: t.treatmentDescription,
          absence: t.absence,
          resolution: t.resolution,
          assignedDepartmentId: assignedDepartment.id,
          assigneeId: assignee?.id,
          status: t.status,
          source: SourceEnum.SYSTEM,
          isActive: true,
          createdBy: creator.id,
          injuredPersons: injuredPersons.length > 0 ? { create: injuredPersons } : undefined,
          witnesses: witnesses.length > 0 ? { create: witnesses } : undefined,
          assets: assets.length > 0 ? { create: assets } : undefined,
        },
      });

      createdIncidents.push(incident);
      console.log(`✅ Created security incident: ${incident.code} - ${t.subject}`);
    }

    console.log(`✅ Incidents seeded successfully`);
    console.log(`   - Created ${createdIncidents.length} incidents (general + security)`);

    return createdIncidents;
  } catch (error) {
    console.error('❌ Error seeding incidents:', error);
    throw error;
  }
};

export default seedIncidents;
