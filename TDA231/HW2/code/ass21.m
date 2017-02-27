%% 2.1d
iclass1 = crossvalind('Kfold', 1000, 5);
iclass2 = crossvalind('Kfold', 1000, 5);

p1 = zeros(400, 3); c1 = 1;
p2 = zeros(400, 3); c2 = 1;
p3 = zeros(400, 3); c3 = 1;
p4 = zeros(400, 3); c4 = 1;
p5 = zeros(400, 3); c5 = 1;

for i = 1:size(iclass1) 
   if iclass1(i) == 1
       p1(c1, :) = x(i,:);
       p1(c1+200, :) = x(i+1000, :);
       c1 = c1 +1;
   elseif iclass1(i) == 2
       p2(c2, :) = x(i,:);
       p2(c2+200, :) = x(i+1000, :);
       c2 = c2 + 1;
   elseif iclass1(i) == 3
       p3(c3, :) = x(i,:);
       p3(c3+200, :) = x(i+1000, :);
       c3 = c3 + 1;
   elseif iclass1(i) == 4
       p4(c4, :) = x(i,:);
       p4(c4+200, :) = x(i+1000, :);
       c4 = c4 + 1;
   else
       p5(c5, :) = x(i,:);
       p5(c5+200, :) = x(i+1000, :);
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

[errors11, errors12] = finderrors(p1, mu11, mu12, sigma11, sigma12, 200);
[errors21, errors22] = finderrors(p2, mu21, mu22, sigma21, sigma22, 200);
[errors31, errors32] = finderrors(p3, mu31, mu32, sigma31, sigma32, 200);
[errors41, errors42] = finderrors(p4, mu41, mu42, sigma41, sigma42, 200);
[errors51, errors52] = finderrors(p5, mu51, mu52, sigma51, sigma52, 200);

errors_sph_bayes = (errors11 + errors21 + errors31 + errors41 + errors51) / 2000
errors11/400
errors21/400
errors31/400
errors41/400
errors51/400

errors_new_classifier = (errors12 + errors22 + errors32 + errors42 + errors52) / 2000
errors12/400
errors22/400
errors32/400
errors42/400
errors52/400

