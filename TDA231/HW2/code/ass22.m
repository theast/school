%% 2.2a
y = reshape(data(:, 1064, 5) , 16, 16); % 16x16 image
imshow(y);

data5 = data(:, :, 5)';
[mu5, sigma5] = sgeass22(data5);

Z = data5';

data8 = data(:, :, 8)';
[mu8, sigma8] = sgeass22(data8);

% 1 belongs to class 5, -1 belongs to class 8
counter = 0;
for i=1:size(data5)
    if (new_classifier(data(:, i, 5)', mu5, mu8) == -1)
       sprintf('Index: %d is 5 but was classified as 8', i)
       counter = counter + 1;
    end
    
    if (new_classifier(data(:, i, 8)', mu5, mu8) == 1)
       sprintf('Index: %d is 8 but was classified as 5', i)
       counter = counter + 1;
    end
end

sprintf('Number of misclassifications: %d', counter) 
%% 2.2b
data5 = data(:, :, 5)';
data8 = data(:, :, 8)';

mu5a = sgeass22(data5);
mu8a = sgeass22(data8);

mu5b = scaleimages(data5);
mu8b = scaleimages(data8);

new_classifier(data(:, 2, 5)', mu5a, mu8a)
new_classifier(featurefunction(data(:, 2, 5)')', mu5b, mu8b)

%% 2.2c
iclass1 = crossvalind('Kfold', 1100, 5);
iclass2 = crossvalind('Kfold', 1100, 5);

offset = 220;

p1 = zeros(440, 256); c1 = 1;
p2 = zeros(440, 256); c2 = 1;
p3 = zeros(440, 256); c3 = 1;
p4 = zeros(440, 256); c4 = 1;
p5 = zeros(440, 256); c5 = 1;

for i = 1:size(iclass1) 
   if iclass1(i) == 1
       p1(c1, :) = data(:, i, 5)';
       p1(c1+offset, :) = data(:, i, 8)';
       c1 = c1 +1;
   elseif iclass1(i) == 2
       p2(c2, :) = data(:, i, 5)';
       p2(c2+offset, :) = data(:, i, 8)';
       c2 = c2 + 1;
   elseif iclass1(i) == 3
       p3(c3, :) = data(:, i, 5)';
       p3(c3+offset, :) = data(:, i, 8)';
       c3 = c3 + 1;
   elseif iclass1(i) == 4
       p4(c4, :) = data(:, i, 5)';
       p4(c4+offset, :) = data(:, i, 8)';
       c4 = c4 + 1;
   else
       p5(c5, :) = data(:, i, 5)';
       p5(c5+offset, :) = data(:, i, 8)';
       c5 = c5 + 1;
   end
end

tdata1 = fixpartitions(p2, p3, p4, p5);
tdata2 = fixpartitions(p3, p4, p5, p1);
tdata3 = fixpartitions(p4, p5, p1, p2);
tdata4 = fixpartitions(p5, p1, p2, p3);
tdata5 = fixpartitions(p1, p2, p3, p4);

[mu11, mu12, sigma11, sigma12] = sgeass21(tdata1);
[mu21, mu22, sigma21, sigma22] = sgeass21(tdata2);
[mu31, mu32, sigma31, sigma32] = sgeass21(tdata3);
[mu41, mu42, sigma41, sigma42] = sgeass21(tdata4);
[mu51, mu52, sigma51, sigma52] = sgeass21(tdata5);

errors12 = finderrors22(p1, mu11, mu12, offset);
errors22 = finderrors22(p2, mu21, mu22, offset);
errors32 = finderrors22(p3, mu31, mu32, offset);
errors42 = finderrors22(p4, mu41, mu42, offset);
errors52 = finderrors22(p5, mu51, mu52, offset);

errors_new_classifier1 = (errors12 + errors22 + errors32 + errors42 + errors52) / 2200
errors12/440
errors22/440
errors32/440
errors42/440
errors52/440

mu11 = scaleimages(tdata1(1:880, :));
mu21 = scaleimages(tdata2(1:880, :));
mu31 = scaleimages(tdata3(1:880, :));
mu41 = scaleimages(tdata4(1:880, :));
mu51 = scaleimages(tdata5(1:880, :));

mu12 = scaleimages(tdata1(881:1760, :));
mu22 = scaleimages(tdata2(881:1760, :));
mu32 = scaleimages(tdata3(881:1760, :));
mu42 = scaleimages(tdata4(881:1760, :));
mu52 = scaleimages(tdata5(881:1760, :));

[mu, p12] = scaleimages(p1);
[mu, p22] = scaleimages(p2);
[mu, p32] = scaleimages(p3);
[mu, p42] = scaleimages(p4);
[mu, p52] = scaleimages(p5);

errors11 = finderrors22(p12, mu11, mu12, offset);
errors21 = finderrors22(p22, mu21, mu22, offset);
errors31 = finderrors22(p32, mu31, mu32, offset);
errors41 = finderrors22(p42, mu41, mu42, offset);
errors51 = finderrors22(p52, mu51, mu52, offset);

errors_new_classifier2 = (errors11 + errors21 + errors31 + errors41 + errors51) / 2200
errors11/440
errors21/440
errors31/440
errors41/440
errors51/440


























