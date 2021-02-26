import util from 'util';
import childProcess from 'child_process';
import { ALPHA_RELEASE, MAJOR_RELEASE, MINOR_RELEASE, RELEASE_LABELS } from './constants';
import { PR } from './types';

const exec = util.promisify(childProcess.exec);

export function isReleasePR(pr: PR) {
  return RELEASE_LABELS.some(releaseLabel => pr.labels.some(label => label.name === releaseLabel));
}

export default async function performLernaRelease(prsSinceLastTag: PR[]) {
  const releasePRsSinceLastTag = prsSinceLastTag.filter(isReleasePR);

  if (releasePRsSinceLastTag.length === 0) {
    console.log('No release PRs found for commits since last release. Exiting.');
    process.exit(0);
  }

  // run lerna based on the type of release
  const isPreRelease = releasePRsSinceLastTag.some(pr =>
    pr.labels.some(label => label.name === ALPHA_RELEASE),
  );
  const isMinor = releasePRsSinceLastTag.some(pr =>
    pr.labels.some(label => label.name === MINOR_RELEASE),
  );
  const isMajor = releasePRsSinceLastTag.some(pr =>
    pr.labels.some(label => label.name === MAJOR_RELEASE),
  );

  // perform release
  try {
    const version = `${isPreRelease ? 'pre' : ''}${
      isMajor ? 'major' : isMinor ? 'minor' : 'patch'
    }`;
    console.log(`Attempting to publish a '${version}' release.`);

    const { stdout, stderr } = await exec(
      `yarn lerna publish ${version} --exact --yes --allow-branch chris--actions-prlabels`,
    );
    if (stdout) {
      console.log('Lerna output', stdout);
    }
    if (stderr) {
      console.warn('The following stderr was generated during publishing. Exiting.', stderr);
      process.exit(1);
    }
  } catch (e) {
    console.warn('The following error occurred during publishing. Exiting.', e.message);
    process.exit(1);
  }
}