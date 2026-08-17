import assert from 'node:assert/strict';
import { matchesUserRequest } from './services/sources/bayt.js';

const cases = [
  {
    name: 'matches software engineer in Lahore',
    input: { keyword: 'software engineer', location: 'Lahore' },
    title: 'Senior Software Engineer',
    location: 'Lahore, Pakistan',
    description: 'Build backend services and APIs for web applications.',
    expected: true
  },
  {
    name: 'rejects unrelated sales role',
    input: { keyword: 'software engineer', location: 'Lahore' },
    title: 'Sales Executive',
    location: 'Lahore, Pakistan',
    description: 'Drive revenue and customer growth.',
    expected: false
  },
  {
    name: 'accepts frontend developer with close city match',
    input: { keyword: 'frontend developer', location: 'Islamabad' },
    title: 'Frontend React Developer',
    location: 'Rawalpindi, Pakistan',
    description: 'Build UI with React and TypeScript.',
    expected: true
  },
  {
    name: 'rejects non-software developer role',
    input: { keyword: 'software engineer', location: 'Karachi' },
    title: 'Property Developer',
    location: 'Karachi, Pakistan',
    description: 'Develop new real-estate properties.',
    expected: false
  },
  {
    name: 'accepts generic developer search for frontend work',
    input: { keyword: 'developer', location: 'Lahore' },
    title: 'Frontend Developer',
    location: 'Lahore, Pakistan',
    description: 'Build UI with React and TypeScript at scale.',
    expected: true
  },
  {
    name: 'rejects generic developer search for property or sales work',
    input: { keyword: 'developer', location: 'Lahore' },
    title: 'Property Developer',
    location: 'Lahore, Pakistan',
    description: 'Develop residential projects and manage sales.',
    expected: false
  },
  {
    name: 'rejects software QA title even when city matches',
    input: { keyword: 'software engineer', location: 'Islamabad' },
    title: 'Software Quality Assurance / SQA Analyst',
    location: 'Islamabad',
    description: 'Quality assurance and testing for software products.',
    expected: false
  },
  {
    name: 'case A rejects software QA in Islamabad for Sahiwal search',
    input: { keyword: 'software engineer', location: 'Sahiwal' },
    title: 'Software Quality Assurance / SQA Analyst',
    location: 'Islamabad',
    description: 'Quality assurance and testing for software products.',
    expected: false
  },
  {
    name: 'case B allows remote developer when remote is the job location',
    input: { keyword: 'software engineer', location: 'Sukkur' },
    title: 'Sr. Full Stack Node.Js Developer - Remote',
    location: 'Remote',
    description: 'Develop web applications remotely.',
    expected: true
  },
  {
    name: 'case C matches software engineer in Lahore',
    input: { keyword: 'software engineer', location: 'Lahore' },
    title: 'Software Engineer',
    location: 'Lahore',
    description: 'Build scalable backend and frontend systems.',
    expected: true
  },
  {
    name: 'case D rejects software engineer in Islamabad for Sahiwal search',
    input: { keyword: 'software engineer', location: 'Sahiwal' },
    title: 'Software Engineer',
    location: 'Islamabad',
    description: 'Build software systems and APIs.',
    expected: false
  }
];

for (const testCase of cases) {
  const actual = matchesUserRequest(
    testCase.input,
    testCase.title,
    testCase.location,
    testCase.description
  );

  assert.equal(
    actual,
    testCase.expected,
    `${testCase.name}: expected ${testCase.expected} but got ${actual}`
  );
}

console.log(`Bayt relevance tests passed: ${cases.length} cases`);
