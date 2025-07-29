/**
 * Prompt templates for different career counseling scenarios
 */

import { StudentProfile } from '../types/studentProfile';

export class PromptTemplates {
  /**
   * Generate NEP 2020 aligned career guidance prompt
   */
  static generateNEP2020Prompt(profile: StudentProfile): string {
    return `As an expert career counselor specializing in NEP 2020 implementation, analyze this student profile and provide career recommendations that align with the National Education Policy 2020's vision of holistic, multidisciplinary education.

NEP 2020 KEY PRINCIPLES TO CONSIDER:
1. Multidisciplinary and holistic education
2. Critical thinking and creativity emphasis
3. Flexibility in subject choices
4. Skill-based learning and vocational education
5. Technology integration in education
6. Local language and cultural preservation
7. Research and innovation focus
8. Entrepreneurship and startup culture
9. Sustainable development goals alignment
10. Global competency with Indian values

STUDENT PROFILE ANALYSIS:
${this.formatStudentProfile(profile)}

Provide recommendations that specifically address:
- How each career aligns with NEP 2020's multidisciplinary approach
- Integration of traditional knowledge with modern skills
- Opportunities for research and innovation
- Entrepreneurship potential in each field
- Technology integration requirements
- Contribution to sustainable development goals
- Cultural and social impact potential`;
  }

  /**
   * Generate prompt for students with financial constraints
   */
  static generateFinancialConstraintsPrompt(profile: StudentProfile): string {
    return `As a career counselor specializing in affordable education pathways, provide career recommendations for a student with financial constraints. Focus on:

FINANCIAL CONSIDERATIONS:
- Low-cost or free education options
- Government scholarships and schemes
- Skill-based careers with shorter training periods
- Work-study opportunities
- Online and distance learning options
- Government job opportunities with job security
- Entrepreneurship with low initial investment

${this.formatStudentProfile(profile)}

For each recommendation, specifically include:
- Detailed scholarship opportunities (government and private)
- Low-cost education pathways
- Earning potential during studies (part-time work, internships)
- Government schemes and support programs
- Free online resources and certifications
- Community college and polytechnic options
- Skill development programs by government`;
  }

  /**
   * Generate prompt for rural students
   */
  static generateRuralStudentPrompt(profile: StudentProfile): string {
    return `As a career counselor with expertise in rural development and education, provide career recommendations that consider the unique challenges and opportunities for rural students.

RURAL CONTEXT CONSIDERATIONS:
- Limited access to educational institutions
- Agricultural and rural economy integration
- Digital divide and technology access
- Migration vs. local development opportunities
- Traditional skills and modern career integration
- Government rural development schemes
- Agri-tech and rural innovation opportunities

${this.formatStudentProfile(profile)}

Focus on careers that:
- Can be pursued with limited infrastructure
- Contribute to rural development
- Leverage traditional knowledge and skills
- Offer opportunities in tier-2 and tier-3 cities
- Support agricultural and allied sectors
- Enable entrepreneurship in rural areas
- Utilize government rural development programs`;
  }

  /**
   * Generate prompt for students interested in emerging technologies
   */
  static generateTechFocusedPrompt(profile: StudentProfile): string {
    return `As a career counselor specializing in emerging technologies and Industry 4.0, provide career recommendations that align with India's digital transformation and technological advancement goals.

TECHNOLOGY FOCUS AREAS:
- Artificial Intelligence and Machine Learning
- Data Science and Analytics
- Cybersecurity and Information Security
- Cloud Computing and DevOps
- Internet of Things (IoT)
- Blockchain and Cryptocurrency
- Augmented/Virtual Reality
- Robotics and Automation
- Quantum Computing
- Green Technology and Sustainability

${this.formatStudentProfile(profile)}

For each recommendation, emphasize:
- Specific technology skills and certifications
- Industry 4.0 relevance and future prospects
- Startup ecosystem opportunities
- Government digital initiatives alignment
- International career opportunities
- Continuous learning and upskilling requirements
- Innovation and research potential`;
  }

  /**
   * Generate prompt for students with disabilities
   */
  static generateInclusiveCareerPrompt(profile: StudentProfile): string {
    return `As an inclusive career counselor specializing in accessibility and disability support, provide career recommendations that consider the student's abilities and potential accommodations.

INCLUSIVE CAREER CONSIDERATIONS:
- Accessibility requirements and accommodations
- Remote work and flexible employment options
- Assistive technology integration
- Government schemes for persons with disabilities
- Inclusive workplace environments
- Skill-based career opportunities
- Entrepreneurship and self-employment options
- Support systems and resources available

${this.formatStudentProfile(profile)}

Focus on:
- Careers that leverage the student's strengths
- Workplace accessibility and accommodations
- Government reservations and support schemes
- Technology tools and assistive devices
- Flexible work arrangements
- Inclusive companies and organizations
- Skill development programs for PWD
- Success stories and role models`;
  }

  /**
   * Generate prompt for high-achieving students
   */
  static generateHighAchieverPrompt(profile: StudentProfile): string {
    return `As a career counselor for high-achieving students, provide ambitious career recommendations that match exceptional academic performance and leadership potential.

HIGH ACHIEVER FOCUS:
- Prestigious institutions and programs
- Research and academic excellence opportunities
- Leadership and management tracks
- International exposure and global careers
- Innovation and entrepreneurship
- Social impact and nation-building roles
- Competitive examinations and selections
- Merit-based scholarships and fellowships

${this.formatStudentProfile(profile)}

Recommendations should include:
- Top-tier institutions and competitive programs
- Research opportunities and PhD pathways
- International study and career options
- Leadership development programs
- Innovation and startup ecosystems
- Civil services and public policy roles
- Corporate leadership tracks
- Social entrepreneurship opportunities`;
  }

  /**
   * Generate prompt for students with creative interests
   */
  static generateCreativeCareerPrompt(profile: StudentProfile): string {
    return `As a career counselor specializing in creative industries, provide recommendations that balance artistic passion with practical career prospects in India's growing creative economy.

CREATIVE INDUSTRIES FOCUS:
- Media and Entertainment
- Design and Visual Arts
- Digital Content Creation
- Fashion and Lifestyle
- Gaming and Animation
- Advertising and Marketing
- Publishing and Literature
- Performing Arts
- Cultural Heritage and Tourism
- Creative Technology

${this.formatStudentProfile(profile)}

Consider:
- Portfolio development and skill building
- Industry networking and mentorship
- Freelancing and gig economy opportunities
- Digital platforms and online presence
- Government support for creative industries
- Cultural preservation and innovation
- Commercial viability and market demand
- Technology integration in creative fields`;
  }

  /**
   * Format student profile for prompt inclusion
   */
  private static formatStudentProfile(profile: StudentProfile): string {
    const { personalInfo, academicData, socioeconomicData, familyIncome, aspirations, constraints } = profile;

    return `STUDENT PROFILE:
Personal: ${personalInfo.name}, Grade ${personalInfo.grade}, ${personalInfo.board} board, ${personalInfo.languagePreference} preference
Academic: Interests in ${academicData.interests.join(', ')}, Performance: ${academicData.performance}
Location: ${socioeconomicData.location} (${socioeconomicData.ruralUrban})
Family Income: ${familyIncome}
Background: ${socioeconomicData.familyBackground}
Economic Factors: ${socioeconomicData.economicFactors.join(', ')}
Technology Access: Internet ${socioeconomicData.internetAccess ? 'available' : 'limited'}, Devices: ${socioeconomicData.deviceAccess.join(', ')}
Aspirations: ${aspirations?.preferredCareers?.join(', ') || 'Open to suggestions'}
Constraints: ${constraints?.financialConstraints ? 'Financial constraints present' : 'No major financial constraints'}`;
  }

  /**
   * Generate follow-up questions prompt for incomplete profiles
   */
  static generateFollowUpQuestionsPrompt(profile: StudentProfile): string {
    const missingInfo = this.identifyMissingInformation(profile);
    
    return `Based on the student profile provided, generate 3-5 targeted follow-up questions to gather missing information that would improve career recommendation accuracy.

CURRENT PROFILE:
${this.formatStudentProfile(profile)}

MISSING INFORMATION IDENTIFIED:
${missingInfo.join('\n')}

Generate questions that:
1. Are culturally appropriate for Indian students
2. Help understand career motivations and goals
3. Clarify academic strengths and challenges
4. Explore family and social influences
5. Assess practical constraints and opportunities

Format as a JSON array of question objects with 'question' and 'purpose' fields.`;
  }

  /**
   * Identify missing information in student profile
   */
  private static identifyMissingInformation(profile: StudentProfile): string[] {
    const missing: string[] = [];

    if (!profile.personalInfo.age) missing.push('- Student age for age-appropriate recommendations');
    if (!profile.personalInfo.gender) missing.push('- Gender for gender-specific opportunities and challenges');
    if (!profile.academicData.favoriteSubjects?.length) missing.push('- Favorite subjects for interest alignment');
    if (!profile.academicData.extracurricularActivities?.length) missing.push('- Extracurricular activities for skill assessment');
    if (!profile.socioeconomicData.parentOccupation?.father && !profile.socioeconomicData.parentOccupation?.mother) {
      missing.push('- Parent occupations for family influence understanding');
    }
    if (!profile.aspirations?.preferredCareers?.length) missing.push('- Career preferences and aspirations');
    if (!profile.aspirations?.salaryExpectations) missing.push('- Salary expectations and financial goals');

    return missing;
  }

  /**
   * Generate prompt for career comparison
   */
  static generateCareerComparisonPrompt(careers: string[], profile: StudentProfile): string {
    return `As a career counselor, provide a detailed comparison of the following career options for this student profile:

CAREERS TO COMPARE: ${careers.join(', ')}

${this.formatStudentProfile(profile)}

For each career, provide:
1. Match score with student profile (0-100)
2. Educational requirements and pathways
3. Skill requirements and development
4. Career prospects and growth potential
5. Salary expectations and financial outlook
6. Work-life balance considerations
7. Industry trends and future outlook
8. Pros and cons specific to this student
9. Entry barriers and challenges
10. Success factors and recommendations

Format as a structured comparison table with detailed analysis for each criterion.`;
  }
}