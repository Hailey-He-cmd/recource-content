const fs = require('fs');
const content = fs.readFileSync('src/template.ts', 'utf8');

const replacement = `    <div class="modal fade" id="templateModal" tabindex="-1" aria-labelledby="templateModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-body">
            <h3 class="modal-title">AI Prompt Tutorial: <b>Bohag Bihu Couple</b> Festive Edits</h3>
            <div class="modal-close" data-dismiss="modal" aria-label="Close"><svg width="100%" height="100%" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="19" cy="19" r="14" fill="#C7D4E0" fill-opacity="0.09"/><path d="M23.6663 14.3334L18.9997 19M18.9997 19L14.333 23.6667M18.9997 19L14.333 14.3334M18.9997 19L23.6663 23.6667" stroke="#F0F8FE" stroke-opacity="0.4" stroke-width="2.33333" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <div class="video-wrapper" v-if="selectedTemplate">
              <div class="left-video">
                <div class="video-container">
                  <video v-if="selectedTemplate.video" :src="selectedTemplate.video" :poster="selectedTemplate.poster" autoplay muted loop preload="metadata" webkit-playsinline="true" playsinline="true" ref="modalVideo"></video>
                  <img v-else :src="selectedTemplate.poster" :alt="selectedTemplate.title">
                  <div class="ratio-icon">{{ getRatioText(selectedTemplate.ratio) }}</div>
                  <div v-if="selectedTemplate.video && selectedTemplate.hasAudio" :class="modalMuted ? 'video-muted' : 'video-muted active'" @click="toggleModalMute()"></div>
                </div>
              </div>

              <div class="right-intro">
                <div class="template-details">
                  <div class="title-row">
                    <h4 class="template-modal-title">{{ selectedTemplate.title }}</h4>
                  </div>

                  <div class="detail-row category" v-if="selectedTemplate.category.length">
                    <span class="detail-label"><img src="https://images.wondershare.com/filmora/images2025/resource-video-template/category-icon.svg" alt="category-icon"> Category:</span>
                    <span v-for="cat in selectedTemplate.category.slice(0, 3)" :key="cat" class="detail-value">
                        <span>{{cat}}</span>
                    </span>
                  </div>

                  <div class="detail-row" v-if="selectedTemplate.duration">
                    <span class="detail-label"><img src="https://images.wondershare.com/filmora/images2025/resource-video-template/duration-icon.svg" alt="duration-icon"> Duration:</span>
                    <span class="detail-value">{{ selectedTemplate.duration }}</span>
                  </div>

                  <div class="detail-row" v-if="selectedTemplate.ratio">
                    <span class="detail-label"><img src="https://images.wondershare.com/filmora/images2025/resource-video-template/aspect-icon.svg" alt="aspect-icon"> Aspect Ratio:</span>
                    <span class="detail-value">{{ getRatioText(selectedTemplate.ratio) }}</span>
                  </div>

                  <div class="detail-row description" v-if="selectedTemplate.prompt">
                    <div class="detail-label">Copy this prompt to generate a Bohag Bihu Couple AI visual:</div>
                    <div class="detail-description">{{ getCurrentPrompt()}}</div>
                    <div v-if="hasEnglishPrompt()" class="language-toggle-btn" :class="{ active: showEnglishDescription }" @click="toggleDescriptionLanguage()">
                      <span>中</span> <span>En</span>
                    </div>
                    <div class="copy-btn" @click="copyDescription(selectedTemplate.prompt)"><svg width="50%" height="50%" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M7.75 2.75C7.94891 2.75 8.13968 2.82902 8.28033 2.96967C8.42098 3.11032 8.5 3.30109 8.5 3.5V10.5C8.5 10.6989 8.42098 10.8897 8.28033 11.0303C8.13968 11.171 7.94891 11.25 7.75 11.25H2.25C2.15151 11.25 2.05398 11.2306 1.96299 11.1929C1.87199 11.1552 1.78931 11.1 1.71967 11.0303C1.65003 10.9607 1.59478 10.878 1.55709 10.787C1.5194 10.696 1.5 10.5985 1.5 10.5V3.5C1.5 3.30109 1.57902 3.11032 1.71967 2.96967C1.86032 2.82902 2.05109 2.75 2.25 2.75H7.75ZM7.5 3.75H2.5V10.25H7.5V3.75ZM9.748 0.75C9.93453 0.749885 10.1144 0.81928 10.2525 0.944641C10.3906 1.07 10.4771 1.24233 10.495 1.428L10.498 1.5V8.2465C10.4979 8.37394 10.4491 8.49652 10.3616 8.58918C10.2741 8.68185 10.1545 8.73762 10.0273 8.74509C9.90008 8.75255 9.77481 8.71116 9.67708 8.62937C9.57936 8.54757 9.51655 8.43155 9.5015 8.305L9.498 8.2465V1.75H4.5C4.37753 1.74998 4.25933 1.70502 4.16781 1.62364C4.0763 1.54226 4.01783 1.43013 4.0035 1.3085L4 1.25C4.00002 1.12753 4.04498 1.00933 4.12636 0.917814C4.20774 0.826297 4.31987 0.767829 4.4415 0.7535L4.5 0.75H9.748Z" fill="currentcolor"/></g></svg></div>
                  </div>
                  <div class="detail-row" v-if="selectedTemplate.tags && selectedTemplate.tags.length">
                    <b class="detail-label text-white">Tags:</b>
                    <div class="tags-container">
                      <span v-for="tag in selectedTemplate.tags.slice(0, 4)" :key="tag" class="tag-item">{{ tag }}</span>
                    </div>
                  </div>
                  <div class="mt-xl-4 mt-3">
                    <a href="https://download.wondershare.com/filmora_full846.exe" class="btn btn-secondary btn-lg dev-desktop sys-win d-inline-flex align-items-center justify-content-center w-100"><i class="wsc-icon mr-2"><svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.875 15.8125V19.125C2.875 19.6773 3.32272 20.125 3.875 20.125H19.125C19.6773 20.125 20.125 19.6773 20.125 19.125V15.8125" stroke="currentcolor" stroke-width="2.3" stroke-linecap="round"/><path d="M11.5 2.875V14.375M11.5 14.375L17.25 9.78811M11.5 14.375L5.75 9.78811" stroke="currentcolor" stroke-width="2.3" stroke-linecap="round"/></svg></i> Download Bohag Bihu AI Tool</a>
                    <a href="https://download.wondershare.com/filmora-mac_full14792.dmg" class="btn btn-secondary btn-lg dev-desktop sys-mac d-inline-flex align-items-center justify-content-center w-100"><i class="wsc-icon mr-2"><svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.875 15.8125V19.125C2.875 19.6773 3.32272 20.125 3.875 20.125H19.125C19.6773 20.125 20.125 19.6773 20.125 19.125V15.8125" stroke="currentcolor" stroke-width="2.3" stroke-linecap="round"/><path d="M11.5 2.875V14.375M11.5 14.375L17.25 9.78811M11.5 14.375L5.75 9.78811" stroke="currentcolor" stroke-width="2.3" stroke-linecap="round"/></svg></i>Download AI Photo Generator Tool</a>
                    <a href="https://filmora.go.link/azWB4" class="btn btn-secondary btn-lg dev-mobile w-100">Download AI Prompt Tool</a>
                  </div>
                </div>
              </div>
            </div>

            <div class="similar-section mt-4" v-if="selectedTemplate && relatedItems && relatedItems.length > 0">
              <h4 class="similar-title">Similar <b>Bohag Bihu Couple Photo</b> AI Guides</h4>
              <div class="similar-grid">
                <div v-for="item in relatedItems.slice(0, 4)" :key="item.id" class="similar-item"
                  @click="switchToTemplate(item.id)">
                  <div class="img-container similar-image-container">
                     <div v-if="selectedTemplate.isVip" class="vip-badge"></div>
                    <img :src="item.poster" :alt="item.title" class="similar-image">
                    <div class="similar-ratio" v-if="item.ratio">{{ getRatioText(item.ratio) }}</div>
                  </div>
                  <div class="similar-title-text">{{ item.title }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
       </div>`;

const lines = content.split('\n');
let startIdx = -1;
let endIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<div class="modal fade" id="templateModal"')) {
    startIdx = i;
    break; // Only replace the first one, which is in AI_PROMPTS_BASE_TEMPLATE
  }
}

if (startIdx !== -1) {
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].includes('<div class="float-bottom hide">')) {
      endIdx = i - 1;
      break;
    }
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  lines.splice(startIdx, endIdx - startIdx + 1, replacement);
  fs.writeFileSync('src/template.ts', lines.join('\n'));
  console.log('Successfully replaced modal content.');
} else {
  console.log('Could not find modal boundaries.');
}
