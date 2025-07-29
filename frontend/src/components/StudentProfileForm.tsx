/**
 * Student Profile Form Component
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  StudentProfile, 
  PersonalInfo, 
  AcademicData, 
  SocioeconomicData,
  FormErrors,
  EDUCATION_BOARDS,
  GRADE_LEVELS,
  STUDENT_CATEGORIES,
  FAMILY_INCOME_RANGES,
  COMMON_INTERESTS,
  ECONOMIC_FACTORS,
  DEVICE_ACCESS_OPTIONS,
  INDIAN_STATES
} from '../types';
import { FormValidator } from '../utils/formValidation';
import { useTranslation, useFormTranslation } from '../hooks/useTranslation';
import { useNavigationState } from '../hooks/useNavigationState';
import FormField from './form/FormField';
import './StudentProfileForm.css';

interface StudentProfileFormProps {
  onSubmit: (profile: StudentProfile) => void;
  initialData?: Partial<StudentProfile>;
  isLoading?: boolean;
}

interface FormStep {
  id: string;
  title: string;
  component: React.ReactNode;
}

export const StudentProfileForm: React.FC<StudentProfileFormProps> = React.memo(({
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const { t, language, formatNumber } = useTranslation();
  const personalFormT = useFormTranslation('personalInfo');
  const academicFormT = useFormTranslation('academicInfo');
  const socioFormT = useFormTranslation('socioeconomicInfo');
  const aspirationsFormT = useFormTranslation('aspirations');
  const constraintsFormT = useFormTranslation('constraints');
  const { saveProfileData, navigateWithState, getProfileData } = useNavigationState();

  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<StudentProfile>>({
    personalInfo: {
      name: '',
      grade: '',
      board: '',
      languagePreference: language,
      age: undefined,
      gender: undefined,
      category: undefined,
      physicallyDisabled: false,
    },
    academicData: {
      interests: [],
      subjects: [],
      performance: '',
      favoriteSubjects: [],
      difficultSubjects: [],
      extracurricularActivities: [],
      achievements: [],
    },
    socioeconomicData: {
      location: '',
      familyBackground: '',
      economicFactors: [],
      ruralUrban: 'urban',
      internetAccess: true,
      deviceAccess: [],
      householdSize: undefined,
      parentOccupation: {
        father: '',
        mother: '',
      },
      transportMode: '',
    },
    familyIncome: '',
    aspirations: {
      preferredCareers: [],
      preferredLocations: [],
      salaryExpectations: '',
      workLifeBalance: 'medium',
    },
    constraints: {
      financialConstraints: false,
      locationConstraints: [],
      familyExpectations: [],
      timeConstraints: '',
    },
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form data with initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData(prevData => ({
        ...prevData,
        ...initialData,
      }));
    }
  }, [initialData]);

  // Load saved profile data from navigation state
  useEffect(() => {
    const savedProfileData = getProfileData();
    if (savedProfileData && !initialData) {
      setFormData(prevData => ({
        ...prevData,
        ...savedProfileData,
      }));
    }
  }, [getProfileData, initialData]);

  // Update language preference when language changes
  useEffect(() => {
    setFormData(prevData => ({
      ...prevData,
      personalInfo: {
        ...prevData.personalInfo!,
        languagePreference: language,
      },
    }));
  }, [language]);

  const handleFieldChange = useCallback((fieldName: string, value: any): void => {
    const fieldPath = fieldName.split('.');
    
    setFormData(prevData => {
      const newData = { ...prevData };
      let current: any = newData;
      
      // Navigate to the correct nested object
      for (let i = 0; i < fieldPath.length - 1; i++) {
        if (!current[fieldPath[i]]) {
          current[fieldPath[i]] = {};
        }
        current = current[fieldPath[i]];
      }
      
      // Set the value
      current[fieldPath[fieldPath.length - 1]] = value;
      
      return newData;
    });

    // Mark field as touched
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    // Clear errors for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, [errors]);

  const validateCurrentStep = (): boolean => {
    let stepErrors: FormErrors = {};

    switch (currentStep) {
      case 0: // Personal Info
        stepErrors = FormValidator.validatePersonalInfo(formData.personalInfo || {});
        break;
      case 1: // Academic Info
        stepErrors = FormValidator.validateAcademicInfo(formData.academicData || {});
        break;
      case 2: // Socioeconomic Info
        const socioErrors = FormValidator.validateSocioeconomicInfo(formData.socioeconomicData || {});
        const incomeErrors = FormValidator.validateFamilyIncome(formData.familyIncome || '');
        stepErrors = { ...socioErrors, ...incomeErrors };
        break;
      case 3: // Aspirations (optional)
        // No required validation for aspirations
        break;
      case 4: // Constraints (optional)
        // No required validation for constraints
        break;
    }

    setErrors(stepErrors);
    return !FormValidator.hasErrors(stepErrors);
  };

  const handleNext = (): void => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = (): void => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = (): void => {
    // Validate entire form
    const allErrors = FormValidator.validateStudentProfile(formData);
    setErrors(allErrors);

    if (!FormValidator.hasErrors(allErrors)) {
      // Generate profile ID and timestamp
      const profile: StudentProfile = {
        ...formData,
        id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      } as StudentProfile;

      // Save profile data for navigation
      saveProfileData(profile);
      
      // Navigate to results page
      navigateWithState('/results', { 
        state: { profileId: profile.id },
        preserveData: true 
      });
      
      onSubmit(profile);
    } else {
      // Go to first step with errors
      const errorSteps = [
        FormValidator.hasErrors(FormValidator.validatePersonalInfo(formData.personalInfo || {})),
        FormValidator.hasErrors(FormValidator.validateAcademicInfo(formData.academicData || {})),
        FormValidator.hasErrors({
          ...FormValidator.validateSocioeconomicInfo(formData.socioeconomicData || {}),
          ...FormValidator.validateFamilyIncome(formData.familyIncome || ''),
        }),
        false, // Aspirations
        false, // Constraints
      ];
      
      const firstErrorStep = errorSteps.findIndex(hasError => hasError);
      if (firstErrorStep !== -1) {
        setCurrentStep(firstErrorStep);
      }
    }
  };

  const calculateProgress = useMemo((): number => {
    const totalSteps = steps.length;
    return Math.round(((currentStep + 1) / totalSteps) * 100);
  }, [currentStep, steps.length]);

  // Form step components
  const PersonalInfoStep: React.FC = () => (
    <div className="form-step">
      <h2>{personalFormT.t('form.personalInfo.title')}</h2>
      <p className="step-description">{personalFormT.t('form.personalInfo.description')}</p>
      
      <FormField
        name="personalInfo.name"
        type="text"
        label={personalFormT.getFieldTranslation('name', 'label')}
        value={formData.personalInfo?.name || ''}
        onChange={handleFieldChange}
        placeholder={personalFormT.getFieldTranslation('name', 'placeholder')}
        error={FormValidator.getFirstError(errors, 'name')}
        required
      />

      <div className="form-row">
        <FormField
          name="personalInfo.grade"
          type="select"
          label={personalFormT.getFieldTranslation('grade', 'label')}
          value={formData.personalInfo?.grade || ''}
          onChange={handleFieldChange}
          options={GRADE_LEVELS.map(grade => ({
            value: grade,
            label: grade,
          }))}
          placeholder={personalFormT.getFieldTranslation('grade', 'placeholder')}
          error={FormValidator.getFirstError(errors, 'grade')}
          required
        />

        <FormField
          name="personalInfo.board"
          type="select"
          label={personalFormT.getFieldTranslation('board', 'label')}
          value={formData.personalInfo?.board || ''}
          onChange={handleFieldChange}
          options={EDUCATION_BOARDS.map(board => ({
            value: board,
            label: board,
          }))}
          placeholder={personalFormT.getFieldTranslation('board', 'placeholder')}
          error={FormValidator.getFirstError(errors, 'board')}
          required
        />
      </div>

      <div className="form-row">
        <FormField
          name="personalInfo.age"
          type="number"
          label={personalFormT.getFieldTranslation('age', 'label')}
          value={formData.personalInfo?.age || ''}
          onChange={handleFieldChange}
          placeholder={personalFormT.getFieldTranslation('age', 'placeholder')}
          error={FormValidator.getFirstError(errors, 'age')}
          min={10}
          max={25}
        />

        <FormField
          name="personalInfo.gender"
          type="select"
          label={personalFormT.getFieldTranslation('gender', 'label')}
          value={formData.personalInfo?.gender || ''}
          onChange={handleFieldChange}
          options={[
            { value: 'male', label: personalFormT.getOptionTranslation('gender', 'male') },
            { value: 'female', label: personalFormT.getOptionTranslation('gender', 'female') },
            { value: 'other', label: personalFormT.getOptionTranslation('gender', 'other') },
            { value: 'prefer-not-to-say', label: personalFormT.getOptionTranslation('gender', 'prefer-not-to-say') },
          ]}
          placeholder={personalFormT.getFieldTranslation('gender', 'placeholder')}
        />
      </div>

      <div className="form-row">
        <FormField
          name="personalInfo.category"
          type="select"
          label={personalFormT.getFieldTranslation('category', 'label')}
          value={formData.personalInfo?.category || ''}
          onChange={handleFieldChange}
          options={STUDENT_CATEGORIES.map(category => ({
            value: category,
            label: personalFormT.getOptionTranslation('category', category.toLowerCase()),
          }))}
          placeholder={personalFormT.getFieldTranslation('category', 'placeholder')}
        />

        <FormField
          name="personalInfo.physicallyDisabled"
          type="radio"
          label={personalFormT.getFieldTranslation('physicallyDisabled', 'label')}
          value={formData.personalInfo?.physicallyDisabled ? 'yes' : 'no'}
          onChange={(name, value) => handleFieldChange(name, value === 'yes')}
          options={[
            { value: 'no', label: personalFormT.getFieldTranslation('physicallyDisabled', 'no') },
            { value: 'yes', label: personalFormT.getFieldTranslation('physicallyDisabled', 'yes') },
          ]}
        />
      </div>
    </div>
  );

  const AcademicInfoStep: React.FC = () => (
    <div className="form-step">
      <h2>{academicFormT.t('form.academicInfo.title')}</h2>
      <p className="step-description">{academicFormT.t('form.academicInfo.description')}</p>
      
      <FormField
        name="academicData.interests"
        type="multiselect"
        label={academicFormT.getFieldTranslation('interests', 'label')}
        value={formData.academicData?.interests || []}
        onChange={handleFieldChange}
        options={COMMON_INTERESTS.map(interest => ({
          value: interest,
          label: interest,
        }))}
        helpText={academicFormT.getFieldTranslation('interests', 'helpText')}
        error={FormValidator.getFirstError(errors, 'interests')}
        required
      />

      <FormField
        name="academicData.subjects"
        type="multiselect"
        label={academicFormT.getFieldTranslation('subjects', 'label')}
        value={formData.academicData?.subjects || []}
        onChange={handleFieldChange}
        options={[
          'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi',
          'History', 'Geography', 'Economics', 'Political Science', 'Computer Science',
          'Accountancy', 'Business Studies', 'Psychology', 'Sociology', 'Philosophy',
          'Physical Education', 'Art', 'Music'
        ].map(subject => ({
          value: subject,
          label: subject,
        }))}
        error={FormValidator.getFirstError(errors, 'subjects')}
        required
      />

      <FormField
        name="academicData.performance"
        type="select"
        label={academicFormT.getFieldTranslation('performance', 'label')}
        value={formData.academicData?.performance || ''}
        onChange={handleFieldChange}
        options={[
          { value: 'excellent', label: academicFormT.getOptionTranslation('performance', 'excellent') },
          { value: 'good', label: academicFormT.getOptionTranslation('performance', 'good') },
          { value: 'average', label: academicFormT.getOptionTranslation('performance', 'average') },
          { value: 'below-average', label: academicFormT.getOptionTranslation('performance', 'below-average') },
        ]}
        placeholder={academicFormT.getFieldTranslation('performance', 'placeholder')}
        error={FormValidator.getFirstError(errors, 'performance')}
        required
      />

      <div className="form-row">
        <FormField
          name="academicData.favoriteSubjects"
          type="multiselect"
          label={academicFormT.getFieldTranslation('favoriteSubjects', 'label')}
          value={formData.academicData?.favoriteSubjects || []}
          onChange={handleFieldChange}
          options={(formData.academicData?.subjects || []).map(subject => ({
            value: subject,
            label: subject,
          }))}
          helpText={academicFormT.getFieldTranslation('favoriteSubjects', 'helpText')}
        />

        <FormField
          name="academicData.difficultSubjects"
          type="multiselect"
          label={academicFormT.getFieldTranslation('difficultSubjects', 'label')}
          value={formData.academicData?.difficultSubjects || []}
          onChange={handleFieldChange}
          options={(formData.academicData?.subjects || []).map(subject => ({
            value: subject,
            label: subject,
          }))}
          helpText={academicFormT.getFieldTranslation('difficultSubjects', 'helpText')}
        />
      </div>

      <FormField
        name="academicData.extracurricularActivities"
        type="multiselect"
        label={academicFormT.getFieldTranslation('extracurricular', 'label')}
        value={formData.academicData?.extracurricularActivities || []}
        onChange={handleFieldChange}
        options={[
          'Sports', 'Music', 'Dance', 'Drama', 'Debate', 'Quiz', 'Art', 'Photography',
          'Writing', 'Robotics', 'Science Club', 'Math Olympiad', 'Model UN',
          'Community Service', 'Environmental Club', 'Student Government'
        ].map(activity => ({
          value: activity,
          label: activity,
        }))}
        helpText={academicFormT.getFieldTranslation('extracurricular', 'helpText')}
      />

      <FormField
        name="academicData.achievements"
        type="textarea"
        label={academicFormT.getFieldTranslation('achievements', 'label')}
        value={formData.academicData?.achievements?.join('\n') || ''}
        onChange={(name, value) => handleFieldChange(name, value.split('\n').filter((item: string) => item.trim()))}
        placeholder={academicFormT.getFieldTranslation('achievements', 'placeholder')}
        helpText={academicFormT.getFieldTranslation('achievements', 'helpText')}
        rows={4}
      />
    </div>
  );

  const SocioeconomicInfoStep: React.FC = () => (
    <div className="form-step">
      <h2>{socioFormT.t('form.socioeconomicInfo.title')}</h2>
      <p className="step-description">{socioFormT.t('form.socioeconomicInfo.description')}</p>
      
      <FormField
        name="socioeconomicData.location"
        type="select"
        label={socioFormT.getFieldTranslation('location', 'label')}
        value={formData.socioeconomicData?.location || ''}
        onChange={handleFieldChange}
        options={INDIAN_STATES.map(state => ({
          value: state,
          label: state,
        }))}
        placeholder={socioFormT.getFieldTranslation('location', 'placeholder')}
        error={FormValidator.getFirstError(errors, 'location')}
        required
      />

      <FormField
        name="familyIncome"
        type="select"
        label={socioFormT.getFieldTranslation('familyIncome', 'label')}
        value={formData.familyIncome || ''}
        onChange={handleFieldChange}
        options={FAMILY_INCOME_RANGES.map(range => ({
          value: range,
          label: socioFormT.getOptionTranslation('familyIncome', range.toLowerCase().replace(/[^a-z0-9]/g, '-')),
        }))}
        placeholder={socioFormT.getFieldTranslation('familyIncome', 'placeholder')}
        error={FormValidator.getFirstError(errors, 'familyIncome')}
        required
      />

      <FormField
        name="socioeconomicData.familyBackground"
        type="textarea"
        label={socioFormT.getFieldTranslation('familyBackground', 'label')}
        value={formData.socioeconomicData?.familyBackground || ''}
        onChange={handleFieldChange}
        placeholder={socioFormT.getFieldTranslation('familyBackground', 'placeholder')}
        helpText={socioFormT.getFieldTranslation('familyBackground', 'helpText')}
        error={FormValidator.getFirstError(errors, 'familyBackground')}
        rows={3}
        required
      />

      <FormField
        name="socioeconomicData.economicFactors"
        type="multiselect"
        label={socioFormT.getFieldTranslation('economicFactors', 'label')}
        value={formData.socioeconomicData?.economicFactors || []}
        onChange={handleFieldChange}
        options={ECONOMIC_FACTORS.map(factor => ({
          value: factor,
          label: factor,
        }))}
        helpText={socioFormT.getFieldTranslation('economicFactors', 'helpText')}
        error={FormValidator.getFirstError(errors, 'economicFactors')}
        required
      />

      <div className="form-row">
        <FormField
          name="socioeconomicData.parentOccupation.father"
          type="text"
          label={socioFormT.getFieldTranslation('parentOccupation.father', 'label')}
          value={formData.socioeconomicData?.parentOccupation?.father || ''}
          onChange={handleFieldChange}
          placeholder={socioFormT.getFieldTranslation('parentOccupation.father', 'placeholder')}
        />

        <FormField
          name="socioeconomicData.parentOccupation.mother"
          type="text"
          label={socioFormT.getFieldTranslation('parentOccupation.mother', 'label')}
          value={formData.socioeconomicData?.parentOccupation?.mother || ''}
          onChange={handleFieldChange}
          placeholder={socioFormT.getFieldTranslation('parentOccupation.mother', 'placeholder')}
        />
      </div>

      <div className="form-row">
        <FormField
          name="socioeconomicData.householdSize"
          type="number"
          label={socioFormT.getFieldTranslation('householdSize', 'label')}
          value={formData.socioeconomicData?.householdSize || ''}
          onChange={handleFieldChange}
          placeholder={socioFormT.getFieldTranslation('householdSize', 'placeholder')}
          helpText={socioFormT.getFieldTranslation('householdSize', 'helpText')}
          min={1}
          max={20}
        />

        <FormField
          name="socioeconomicData.ruralUrban"
          type="select"
          label={socioFormT.getFieldTranslation('ruralUrban', 'label')}
          value={formData.socioeconomicData?.ruralUrban || ''}
          onChange={handleFieldChange}
          options={[
            { value: 'rural', label: socioFormT.getOptionTranslation('ruralUrban', 'rural') },
            { value: 'urban', label: socioFormT.getOptionTranslation('ruralUrban', 'urban') },
            { value: 'semi-urban', label: socioFormT.getOptionTranslation('ruralUrban', 'semi-urban') },
          ]}
          placeholder={socioFormT.getFieldTranslation('ruralUrban', 'placeholder')}
          error={FormValidator.getFirstError(errors, 'ruralUrban')}
          required
        />
      </div>

      <FormField
        name="socioeconomicData.transportMode"
        type="select"
        label={socioFormT.getFieldTranslation('transportMode', 'label')}
        value={formData.socioeconomicData?.transportMode || ''}
        onChange={handleFieldChange}
        options={[
          { value: 'walking', label: socioFormT.getOptionTranslation('transportMode', 'walking') },
          { value: 'bicycle', label: socioFormT.getOptionTranslation('transportMode', 'bicycle') },
          { value: 'public-transport', label: socioFormT.getOptionTranslation('transportMode', 'public-transport') },
          { value: 'private-vehicle', label: socioFormT.getOptionTranslation('transportMode', 'private-vehicle') },
          { value: 'school-bus', label: socioFormT.getOptionTranslation('transportMode', 'school-bus') },
        ]}
        placeholder={socioFormT.getFieldTranslation('transportMode', 'placeholder')}
      />

      <FormField
        name="socioeconomicData.internetAccess"
        type="radio"
        label={socioFormT.getFieldTranslation('internetAccess', 'label')}
        value={formData.socioeconomicData?.internetAccess ? 'yes' : 'no'}
        onChange={(name, value) => handleFieldChange(name, value === 'yes')}
        options={[
          { value: 'yes', label: socioFormT.getFieldTranslation('internetAccess', 'yes') },
          { value: 'no', label: socioFormT.getFieldTranslation('internetAccess', 'no') },
        ]}
        error={FormValidator.getFirstError(errors, 'internetAccess')}
        required
      />

      <FormField
        name="socioeconomicData.deviceAccess"
        type="multiselect"
        label={socioFormT.getFieldTranslation('deviceAccess', 'label')}
        value={formData.socioeconomicData?.deviceAccess || []}
        onChange={handleFieldChange}
        options={DEVICE_ACCESS_OPTIONS.map(device => ({
          value: device,
          label: device,
        }))}
        helpText={socioFormT.getFieldTranslation('deviceAccess', 'helpText')}
        error={FormValidator.getFirstError(errors, 'deviceAccess')}
        required
      />
    </div>
  );

  const AspirationsStep: React.FC = () => (
    <div className="form-step">
      <h2>{aspirationsFormT.t('form.aspirations.title')}</h2>
      <p className="step-description">{aspirationsFormT.t('form.aspirations.description')}</p>
      
      <FormField
        name="aspirations.preferredCareers"
        type="multiselect"
        label={aspirationsFormT.getFieldTranslation('preferredCareers', 'label')}
        value={formData.aspirations?.preferredCareers || []}
        onChange={handleFieldChange}
        options={[
          'Engineering', 'Medicine', 'Teaching', 'Business', 'Law', 'Arts', 'Science Research',
          'Technology', 'Government Service', 'Social Work', 'Journalism', 'Design',
          'Agriculture', 'Defense', 'Banking', 'Entrepreneurship'
        ].map(career => ({
          value: career,
          label: career,
        }))}
        helpText={aspirationsFormT.getFieldTranslation('preferredCareers', 'helpText')}
      />

      <FormField
        name="aspirations.preferredLocations"
        type="multiselect"
        label={aspirationsFormT.getFieldTranslation('preferredLocations', 'label')}
        value={formData.aspirations?.preferredLocations || []}
        onChange={handleFieldChange}
        options={[
          'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune',
          'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Kochi', 'Home State',
          'Anywhere in India', 'International'
        ].map(location => ({
          value: location,
          label: location,
        }))}
        helpText={aspirationsFormT.getFieldTranslation('preferredLocations', 'helpText')}
      />

      <div className="form-row">
        <FormField
          name="aspirations.salaryExpectations"
          type="select"
          label={aspirationsFormT.getFieldTranslation('salaryExpectations', 'label')}
          value={formData.aspirations?.salaryExpectations || ''}
          onChange={handleFieldChange}
          options={[
            { value: 'not-important', label: aspirationsFormT.getOptionTranslation('salaryExpectations', 'not-important') },
            { value: 'basic', label: aspirationsFormT.getOptionTranslation('salaryExpectations', 'basic') },
            { value: 'comfortable', label: aspirationsFormT.getOptionTranslation('salaryExpectations', 'comfortable') },
            { value: 'high', label: aspirationsFormT.getOptionTranslation('salaryExpectations', 'high') },
          ]}
          placeholder={aspirationsFormT.getFieldTranslation('salaryExpectations', 'placeholder')}
        />

        <FormField
          name="aspirations.workLifeBalance"
          type="select"
          label={aspirationsFormT.getFieldTranslation('workLifeBalance', 'label')}
          value={formData.aspirations?.workLifeBalance || ''}
          onChange={handleFieldChange}
          options={[
            { value: 'high', label: aspirationsFormT.getOptionTranslation('workLifeBalance', 'high') },
            { value: 'medium', label: aspirationsFormT.getOptionTranslation('workLifeBalance', 'medium') },
            { value: 'low', label: aspirationsFormT.getOptionTranslation('workLifeBalance', 'low') },
          ]}
          placeholder={aspirationsFormT.getFieldTranslation('workLifeBalance', 'placeholder')}
        />
      </div>
    </div>
  );

  const ConstraintsStep: React.FC = () => (
    <div className="form-step">
      <h2>{constraintsFormT.t('form.constraints.title')}</h2>
      <p className="step-description">{constraintsFormT.t('form.constraints.description')}</p>
      
      <FormField
        name="constraints.financialConstraints"
        type="radio"
        label={constraintsFormT.getFieldTranslation('financialConstraints', 'label')}
        value={formData.constraints?.financialConstraints ? 'yes' : 'no'}
        onChange={(name, value) => handleFieldChange(name, value === 'yes')}
        options={[
          { value: 'no', label: constraintsFormT.getFieldTranslation('financialConstraints', 'no') },
          { value: 'yes', label: constraintsFormT.getFieldTranslation('financialConstraints', 'yes') },
        ]}
      />

      <FormField
        name="constraints.locationConstraints"
        type="multiselect"
        label={constraintsFormT.getFieldTranslation('locationConstraints', 'label')}
        value={formData.constraints?.locationConstraints || []}
        onChange={handleFieldChange}
        options={INDIAN_STATES.map(state => ({
          value: state,
          label: state,
        }))}
        helpText={constraintsFormT.getFieldTranslation('locationConstraints', 'helpText')}
      />

      <FormField
        name="constraints.familyExpectations"
        type="textarea"
        label={constraintsFormT.getFieldTranslation('familyExpectations', 'label')}
        value={formData.constraints?.familyExpectations?.join('\n') || ''}
        onChange={(name, value) => handleFieldChange(name, value.split('\n').filter((item: string) => item.trim()))}
        placeholder={constraintsFormT.getFieldTranslation('familyExpectations', 'placeholder')}
        helpText={constraintsFormT.getFieldTranslation('familyExpectations', 'helpText')}
        rows={3}
      />

      <FormField
        name="constraints.timeConstraints"
        type="textarea"
        label={constraintsFormT.getFieldTranslation('timeConstraints', 'label')}
        value={formData.constraints?.timeConstraints || ''}
        onChange={handleFieldChange}
        placeholder={constraintsFormT.getFieldTranslation('timeConstraints', 'placeholder')}
        helpText={constraintsFormT.getFieldTranslation('timeConstraints', 'helpText')}
        rows={2}
      />
    </div>
  );

  const steps: FormStep[] = useMemo(() => [
    {
      id: 'personal',
      title: t('form.progress.personalInfo', 'Personal Info'),
      component: <PersonalInfoStep />,
    },
    {
      id: 'academic',
      title: t('form.progress.academicInfo', 'Academic Info'),
      component: <AcademicInfoStep />,
    },
    {
      id: 'background',
      title: t('form.progress.backgroundInfo', 'Background Info'),
      component: <SocioeconomicInfoStep />,
    },
    {
      id: 'aspirations',
      title: t('form.progress.aspirations', 'Aspirations'),
      component: <AspirationsStep />,
    },
    {
      id: 'constraints',
      title: t('form.progress.review', 'Review'),
      component: <ConstraintsStep />,
    },
  ], [t]);

  return (
    <div className="student-profile-form">
      {/* Progress indicator */}
      <div className="form-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${calculateProgress}%` }}
          />
        </div>
        <div className="progress-text">
          {t('form.progress.step', 'Step {{current}} of {{total}}', {
            current: currentStep + 1,
            total: steps.length,
          })} - {t('form.progress.completion', '{{percentage}}% Complete', {
            percentage: calculateProgress,
          })}
        </div>
      </div>

      {/* Step indicators */}
      <div className="step-indicators">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`step-indicator ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-title">{step.title}</div>
          </div>
        ))}
      </div>

      {/* Form content */}
      <div className="form-content">
        {steps[currentStep].component}
      </div>

      {/* Navigation buttons */}
      <div className="form-navigation">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="btn btn-secondary"
        >
          {t('common.previous', 'Previous')}
        </button>

        <div className="nav-spacer" />

        {currentStep < steps.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="btn btn-primary"
            disabled={isLoading}
          >
            {t('common.next', 'Next')}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? t('common.loading', 'Loading...') : t('common.submit', 'Submit')}
          </button>
        )}
      </div>

      {/* Error summary */}
      {FormValidator.hasErrors(errors) && (
        <div className="error-summary">
          <h3>{t('errors.validation', 'Please check the form for errors.')}</h3>
          <ul>
            {Object.entries(errors).map(([field, fieldErrors]) => (
              fieldErrors?.map((error, index) => (
                <li key={`${field}-${index}`}>{error}</li>
              ))
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

export default StudentProfileForm;